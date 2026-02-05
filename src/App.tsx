import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';
import { AuthDialog } from './components/AuthDialog';
import { StatusBar } from './components/StatusBar';
import { MainOutput } from './components/MainOutput';
import { InputPanel } from './components/InputPanel';
import { config } from './config';
import './App.css';

type AppState = 'auth' | 'game';

function App() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [wsUrl, setWsUrl] = useState('');
  const [idToken, setIdToken] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const { connected, connecting, messages, send, sendJson, connect } = useWebSocket();
  const { user, loading: authLoading, getIdToken } = useAuth();
  const reconnectAttemptsRef = useRef(0);

  // Auto-detect WebSocket URL on mount (only once)
  useEffect(() => {
    const detectedUrl = config.getDefaultWebSocketUrl();
    setWsUrl(detectedUrl);
    console.log('🌐 Auto-detected WebSocket URL:', detectedUrl);
  }, []); // Only run once on mount

  // Auto-login and auto-connect if user is already authenticated with Firebase
  const connectingRef = useRef(false); // Guard against double-connection in Strict Mode
  const isInitialMountRef = useRef(true); // Track if this is the first mount after page load
  
  useEffect(() => {
    // Only connect if:
    // - Auth is loaded
    // - User is authenticated
    // - We have a WebSocket URL
    // - We're not already connected or connecting
    // - We haven't already initiated a connection in this effect run
    if (!authLoading && user && wsUrl && !connected && !connecting && !connectingRef.current) {
      connectingRef.current = true; // Set guard immediately
      
      // On first mount after page load, add a small delay to let browser fully initialize
      // On subsequent mounts (reloads), add a longer delay to let browser release previous connection
      const delay = isInitialMountRef.current ? 100 : 500;
      isInitialMountRef.current = false;
      
      setTimeout(() => {
        // User is already logged in to Firebase, get token and auto-connect
        getIdToken().then((token) => {
          if (token) {
            console.log('✅ Auto-login: User already authenticated with Firebase, token:', token.substring(0, 20) + '...');
            setIdToken(token);

            // Connect with onOpen callback to send auth immediately when socket opens
            connect(wsUrl, () => {
              console.log('🔐 WebSocket opened, sending auth token immediately');
              sendJson({
                type: 'auth',
                token: token,
              });
            });
          } else {
            connectingRef.current = false; // Reset if no token
          }
        }).catch((err) => {
          console.error('❌ Failed to get ID token:', err);
          connectingRef.current = false; // Reset on error
        });
      }, delay);
    }
    
    // Reset guard when connected
    if (connected) {
      connectingRef.current = false;
    }
  }, [authLoading, user, wsUrl, connected, connecting, getIdToken, connect, sendJson]);

  // Auto-reconnect when disconnected (only in game state, with delay and max retries)
  const MAX_RECONNECT_ATTEMPTS = 3;
  
  useEffect(() => {
    // Only auto-reconnect if:
    // - We're in game state (not auth)
    // - We have a token
    // - We're not connected or connecting
    // - We have a URL
    // - We haven't exceeded max retries
    if (
      appState === 'game' && 
      idToken && 
      !connected && 
      !connecting && 
      wsUrl &&
      reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
    ) {
      reconnectAttemptsRef.current += 1;
      const timer = setTimeout(() => {
        console.log(`🔄 Auto-reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        connect(wsUrl);
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    // Reset reconnect attempts when connected
    if (connected) {
      reconnectAttemptsRef.current = 0;
    }
  }, [connected, connecting, wsUrl, appState, idToken, connect]);

  // Handle WebSocket connection and send token-based auth
  useEffect(() => {
    if (connected && appState === 'auth' && idToken) {
      // Send token immediately after connection
      console.log('🔐 Sending authentication token');
      sendJson({
        type: 'auth',
        token: idToken,
      });
    } else if (connected && appState === 'auth' && !idToken) {
      // Debug: connected but no token yet - try to get it
      console.warn('⚠️ WebSocket connected but idToken not set yet. Attempting to get token...');
      getIdToken().then((token) => {
        if (token) {
          console.log('✅ Got token after connection, sending auth');
          setIdToken(token);
          sendJson({
            type: 'auth',
            token: token,
          });
        } else {
          console.error('❌ Could not get token after connection');
        }
      }).catch((err) => {
        console.error('❌ Error getting token after connection:', err);
      });
    }
  }, [connected, appState, idToken, sendJson, getIdToken]);

  // Handle server responses (JSON messages)
  useEffect(() => {
    if (messages.length > 0 && appState === 'auth') {
      const lastMessage = messages[messages.length - 1];
      
      // Try to parse as JSON
      try {
        const jsonMessage = JSON.parse(lastMessage);
        
        if (jsonMessage.type === 'auth_success') {
          console.log('✅ Authentication successful');
          // If new user, might need character name
          if (jsonMessage.new_user && jsonMessage.character_name_required) {
            // Server will ask for character name via text message
            // We'll handle it in the text message handler below
          } else {
            setAppState('game');
          }
        } else if (jsonMessage.type === 'auth_error') {
          console.error('❌ Authentication error:', jsonMessage.error);
          // Reset to show auth dialog again
          setAppState('auth');
          setIdToken(null);
          setCharacterName('');
        }
        return; // JSON message handled
      } catch (e) {
        // Not JSON, treat as text message
      }
      
      // Handle text messages (for character name prompts, etc.)
      const lastMessageLower = lastMessage.toLowerCase();
      
      // Check if server is asking for character name
      if (lastMessageLower.includes('character name') || lastMessageLower.includes('enter your character name')) {
        if (characterName) {
          console.log('👤 Server asking for character name, sending:', characterName);
          setTimeout(() => {
            send(characterName);
          }, 300);
        }
        // If no character name, user will type it in the input panel
      }
      // Check if we're authenticated (server sends welcome message or game content)
      else if (
        lastMessage.includes('Welcome') ||
        lastMessage.includes('Tyrant') ||
        lastMessage.includes('CHARACTER CREATION') ||
        lastMessage.includes('New Cove') ||
        lastMessage.includes('look') ||
        lastMessage.includes('help')
      ) {
        console.log('✅ Authentication successful (text message)');
        setAppState('game');
      }
      // Check for errors
      else if (
        lastMessageLower.includes('invalid') ||
        lastMessageLower.includes('error') ||
        lastMessageLower.includes('disconnected')
      ) {
        console.error('❌ Authentication failed:', lastMessage);
        setAppState('auth');
        setIdToken(null);
        setCharacterName('');
      }
    }
  }, [messages, appState, characterName, send]);


  const handleAuthenticated = async (_authEmail: string, _authPassword: string, authCharacterName?: string, token?: string | null) => {
    // If token wasn't provided, try to get it now
    let finalToken = token;
    if (!finalToken) {
      console.log('⏳ Token not provided, attempting to retrieve...');
      finalToken = await getIdToken();
      if (!finalToken) {
        // Wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 200));
        finalToken = await getIdToken(true); // Force refresh
      }
    }

    if (finalToken) {
      setIdToken(finalToken);
      if (authCharacterName) {
        setCharacterName(authCharacterName);
      }
      // Connect WebSocket if not already connected
      const urlToUse = wsUrl || config.getDefaultWebSocketUrl();
      if (!wsUrl) {
        setWsUrl(urlToUse);
      }
      if (!connected && !connecting) {
        // Connect with onOpen callback to send auth immediately
        connect(urlToUse, () => {
          if (finalToken) {
            console.log('🔐 WebSocket opened, sending auth token immediately');
            sendJson({
              type: 'auth',
              token: finalToken,
            });
          }
        });
      }
    } else {
      console.error('❌ No token available from Firebase auth. User may need to refresh the page.');
      // Still try to connect - server might handle email/password auth
      const urlToUse = wsUrl || config.getDefaultWebSocketUrl();
      if (!wsUrl) {
        setWsUrl(urlToUse);
      }
      if (!connected && !connecting) {
        connect(urlToUse);
      }
    }
  };

  const handleSend = (command: string) => {
    send(command);
  };

  // Show loading while checking Firebase auth state
  if (authLoading) {
    return (
      <div className="app">
        <div className="auth-dialog">
          <div className="auth-content">
            <div style={{ color: '#0f0', textAlign: 'center' }}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'auth') {
    // Show game UI if we're connected and waiting for character name or game to start
    const showGameUI = connected && messages.length > 0;
    
    if (showGameUI) {
      return (
        <div className="app">
          <div className="header">
            <h1>⚔️ Tyrant of the Dark Skies ⚔️</h1>
          </div>
          <StatusBar connected={connected} connecting={connecting} />
          <MainOutput messages={messages} onCommandClick={(cmd) => send(cmd)} />
          <InputPanel 
            onSend={(cmd) => {
              // If we're waiting for character name, capture it
              if (!characterName && messages.some(m => m.toLowerCase().includes('character name'))) {
                setCharacterName(cmd);
              }
              send(cmd);
            }} 
            disabled={!connected} 
          />
        </div>
      );
    }
    
    // Only show login dialog if user is not authenticated
    // If user is authenticated, we're just waiting for connection/token
    const showLoginDialog = !user && !authLoading;
    
    return (
      <div className="app">
        {showLoginDialog && <AuthDialog onAuthenticated={handleAuthenticated} />}
        {connecting && (
          <div className="connecting-overlay">
            <div className="connecting-message">Connecting to server...</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>
              Make sure the MUD server is running on port 5557
            </div>
          </div>
        )}
        {connected && idToken && (
          <div className="auth-status">
            Authenticating with token...
          </div>
        )}
        {!showLoginDialog && !connected && !connecting && wsUrl && (
          <div className="auth-status">
            <div>Connection failed. Server may not be running.</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
              Expected: {wsUrl}
            </div>
            {wsUrl.startsWith('ws://127.0.0.1') && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                Local dev: start the MUD server (e.g. on port 5557), or set VITE_WEBSOCKET_URL=wss://tyrant-of-dark-skies.fly.dev in .env to use the hosted server.
              </div>
            )}
            {import.meta.env.VITE_WEBSOCKET_URL && !wsUrl.startsWith('ws://127.0.0.1') && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                (Using VITE_WEBSOCKET_URL override)
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>⚔️ Tyrant of the Dark Skies ⚔️</h1>
      </div>
      <StatusBar connected={connected} connecting={connecting} />
      <MainOutput messages={messages} onCommandClick={(cmd) => handleSend(cmd)} />
      <InputPanel onSend={handleSend} disabled={!connected} />
    </div>
  );
}

export default App;
