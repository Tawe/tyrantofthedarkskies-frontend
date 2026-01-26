import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';
import { AuthDialog } from './components/AuthDialog';
import { StatusBar } from './components/StatusBar';
import { MainOutput } from './components/MainOutput';
import { InputPanel } from './components/InputPanel';
import { FirebaseDebug } from './components/FirebaseDebug';
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
  useEffect(() => {
    // Only connect if:
    // - Auth is loaded
    // - User is authenticated
    // - We have a WebSocket URL
    // - We don't have a token yet (to avoid re-connecting)
    // - We're not already connected or connecting
    if (!authLoading && user && !idToken && wsUrl && !connected && !connecting) {
      // User is already logged in to Firebase, get token and auto-connect
      getIdToken().then((token) => {
        if (token) {
          console.log('✅ Auto-login: User already authenticated with Firebase');
          setIdToken(token);
          // Auto-connect to detected WebSocket URL
          connect(wsUrl);
        }
      }).catch((err) => {
        console.error('❌ Failed to get ID token:', err);
      });
    }
  }, [authLoading, user, idToken, wsUrl, connected, connecting, getIdToken, connect]);

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
    }
  }, [connected, appState, idToken, sendJson]);

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
        connect(urlToUse);
      }
      // Token will be sent automatically when connected (handled in useEffect above)
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
          <MainOutput messages={messages} />
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
          <FirebaseDebug />
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
            {import.meta.env.VITE_WEBSOCKET_URL && (
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
      <MainOutput messages={messages} />
      <InputPanel onSend={handleSend} disabled={!connected} />
      <FirebaseDebug />
    </div>
  );
}

export default App;
