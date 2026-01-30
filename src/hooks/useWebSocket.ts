import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  messages: string[];
  send: (message: string) => void;
  sendJson: (data: any) => void;
  connect: (url: string, onOpen?: () => void) => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const onOpenCallbackRef = useRef<(() => void) | null>(null);
  const connectingRef = useRef<boolean>(false); // Guard against concurrent connection attempts
  const connectionTimeoutRef = useRef<number | null>(null); // Timeout for connection attempts
  const connectionCheckIntervalRef = useRef<number | null>(null); // Interval for checking connection progress
  const retryCountRef = useRef<number>(0); // Track retry attempts
  const MAX_RETRIES = 3; // Maximum retry attempts

  const connect = useCallback((url: string, onOpen?: () => void) => {
    // Prevent concurrent connection attempts
    if (connectingRef.current) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Skipping connect - connection attempt already in progress');
      }
      return;
    }

    // Prevent multiple connection attempts if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Skipping connect - already connected');
      }
      return;
    }

    // Clean up any existing connection before opening a new one
    const oldWs = wsRef.current;
    if (oldWs) {
      if (import.meta.env.DEV) {
        console.log('🧹 Cleaning up existing WebSocket before new connection. State:', oldWs.readyState);
      }
      wsRef.current = null; // Clear ref immediately
      try {
        oldWs.close(1000, 'Reconnecting');
      } catch (e) {
        // Ignore errors when closing
      }
      
      // CRITICAL: Wait for old socket to fully close before creating new one
      // Browsers can block new connections if old one is still closing
      if (oldWs.readyState === WebSocket.CLOSING || oldWs.readyState === WebSocket.CONNECTING) {
        if (import.meta.env.DEV) {
          console.log('⏳ Waiting for old WebSocket to finish closing before new connection...');
        }
        const waitForClose = () => {
          if (oldWs.readyState === WebSocket.CLOSED) {
            if (import.meta.env.DEV) {
              console.log('✅ Old WebSocket closed, waiting 200ms before new connection');
            }
            // Small delay to let browser fully release the connection
            setTimeout(() => {
              connectingRef.current = true;
              createNewConnection();
            }, 200);
          } else {
            setTimeout(waitForClose, 100); // Check every 100ms
          }
        };
        setTimeout(waitForClose, 100);
        return;
      }
      
      // Even if socket appears closed, add a small delay to ensure browser has released it
      if (import.meta.env.DEV) {
        console.log('⏳ Adding 200ms delay before new connection to ensure browser cleanup');
      }
      setTimeout(() => {
        connectingRef.current = true;
        createNewConnection();
      }, 200);
      return;
    }

    // Set connecting guard immediately
    connectingRef.current = true;
    createNewConnection();
    
    function createNewConnection() {
      if (import.meta.env.DEV) {
        console.log('🔌 Creating new WebSocket connection to:', url);
        console.log('🔍 Current wsRef state:', wsRef.current?.readyState ?? 'null');
      }
      setConnecting(true);
      
      // Store callback for when socket opens
      onOpenCallbackRef.current = onOpen || null;

      if (import.meta.env.DEV) {
        console.log('🔍 About to call new WebSocket()...');
      }
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
        if (import.meta.env.DEV) {
          console.log('✅ new WebSocket() returned, readyState:', ws.readyState, 'URL:', url);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('❌ Error creating WebSocket:', e);
        }
        connectingRef.current = false;
        setConnecting(false);
        return;
      }
      
      wsRef.current = ws;

      // Monitor connection progress - abort early if stuck
      let connectionStartTime = Date.now();
      connectionCheckIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - connectionStartTime;
        if (ws.readyState === WebSocket.CONNECTING && elapsed > 3000) {
          // Stuck in CONNECTING for 3+ seconds - abort and retry
          if (import.meta.env.DEV) {
            console.warn(`⚠️ WebSocket stuck in CONNECTING for ${elapsed}ms - aborting and retrying...`);
          }
          if (connectionCheckIntervalRef.current !== null) {
            clearInterval(connectionCheckIntervalRef.current);
            connectionCheckIntervalRef.current = null;
          }
          connectingRef.current = false;
          try {
            ws.close();
          } catch (e) {
            // Ignore
          }
          wsRef.current = null;
          setConnecting(false);
          
          // Retry after a delay (with limit)
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            setTimeout(() => {
              if (!connected && !connecting && !connectingRef.current) {
                if (import.meta.env.DEV) {
                  console.log(`🔄 Retrying connection after abort... (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
                }
                connect(url, onOpen);
              }
            }, 1000);
          } else {
            if (import.meta.env.DEV) {
              console.error(`❌ Max retries (${MAX_RETRIES}) reached. Connection failed.`);
            }
            retryCountRef.current = 0; // Reset for next manual attempt
          }
        } else if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSED) {
          // Connection completed (success or failure) - stop monitoring
          if (connectionCheckIntervalRef.current !== null) {
            clearInterval(connectionCheckIntervalRef.current);
            connectionCheckIntervalRef.current = null;
          }
        }
      }, 500); // Check every 500ms

      // Set a timeout to detect if connection hangs (fallback)
      connectionTimeoutRef.current = window.setTimeout(() => {
        if (connectionCheckIntervalRef.current !== null) {
          clearInterval(connectionCheckIntervalRef.current);
          connectionCheckIntervalRef.current = null;
        }
        if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
          if (import.meta.env.DEV) {
            console.error('❌ WebSocket connection timeout after 10s - readyState:', ws.readyState, '- closing hung connection');
          }
          connectingRef.current = false;
          try {
            ws.close();
          } catch (e) {
            // Ignore
          }
          wsRef.current = null;
          setConnecting(false);
        }
        connectionTimeoutRef.current = null;
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        // Clear timeout and interval on success
        if (connectionTimeoutRef.current !== null) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        if (connectionCheckIntervalRef.current !== null) {
          clearInterval(connectionCheckIntervalRef.current);
          connectionCheckIntervalRef.current = null;
        }
        retryCountRef.current = 0; // Reset retry count on success
        connectingRef.current = false; // Clear guard on success
        setConnected(true);
        setConnecting(false);
        if (import.meta.env.DEV) {
          console.log('✅ WebSocket connected successfully');
        }
        // Call stored callback if it exists
        if (onOpenCallbackRef.current) {
          try {
            onOpenCallbackRef.current();
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error('❌ Error in onOpen callback:', e);
            }
          }
          onOpenCallbackRef.current = null;
        }
      };

      ws.onerror = (error) => {
        // Clear timeout and interval on error
        if (connectionTimeoutRef.current !== null) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        if (connectionCheckIntervalRef.current !== null) {
          clearInterval(connectionCheckIntervalRef.current);
          connectionCheckIntervalRef.current = null;
        }
        connectingRef.current = false; // Clear guard on error
        if (import.meta.env.DEV) {
          console.error('❌ WebSocket error:', error);
        }
        setConnecting(false);
        // Don't set connected to false here - let onclose handle it
      };

      ws.onmessage = (event) => {
        if (import.meta.env.DEV) {
          console.log('📨 WebSocket message received:', event.data.substring(0, 100));
        }
        
        // Filter out debug/internal messages that shouldn't be displayed
        const data = event.data;
        
        // Handle auth_success JSON messages - extract message field if present
        try {
          const jsonMessage = JSON.parse(data);
          if (jsonMessage.type === 'auth_success') {
            // If there's a message field, display that instead of the raw JSON
            if (jsonMessage.message) {
              setMessages((prev) => [...prev, jsonMessage.message]);
            }
            // Don't display the raw JSON itself
            return;
          }
        } catch (e) {
          // Not JSON, continue to text filtering
        }
        
        // Skip entire message only for "Invalid command format"
        const dataLower = data.toLowerCase();
        if (dataLower.includes('invalid command format')) {
          return; // Don't add to messages array
        }
        
        // Strip only lines containing "Combat environment" or "Room flags" (keep room description and exits)
        let toDisplay = event.data;
        if (dataLower.includes('combat environment') || dataLower.includes('room flags')) {
          const lines = toDisplay.split(/\r?\n/);
          const filtered = lines.filter(
            (line: string) =>
              !line.toLowerCase().includes('combat environment') &&
              !line.toLowerCase().includes('room flags')
          );
          toDisplay = filtered.join('\n');
        }
        if (toDisplay.trim()) {
          setMessages((prev) => [...prev, toDisplay]);
        }
      };
      
      ws.onclose = (event) => {
        // Clear timeout and interval on close
        if (connectionTimeoutRef.current !== null) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        if (connectionCheckIntervalRef.current !== null) {
          clearInterval(connectionCheckIntervalRef.current);
          connectionCheckIntervalRef.current = null;
        }
        connectingRef.current = false; // Clear guard on close
        if (import.meta.env.DEV) {
          console.log('🔌 WebSocket closed:', event.code, event.reason || 'No reason');
        }
        wsRef.current = null;
        onOpenCallbackRef.current = null; // Clear callback on close
        setConnected(false);
        setConnecting(false);
      };
    }
  }, []);

  const disconnect = useCallback(() => {
    connectingRef.current = false; // Clear guard
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore
      }
      wsRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
  }, []);

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (import.meta.env.DEV) {
        console.log('📤 WebSocket sending:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
      }
      wsRef.current.send(message);
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Cannot send message, WebSocket not open. State:', wsRef.current?.readyState);
      }
    }
  }, []);

  const sendJson = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify(data);
      if (import.meta.env.DEV) {
        console.log('📤 WebSocket sending JSON:', data.type || 'unknown');
      }
      wsRef.current.send(jsonMessage);
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Cannot send JSON, WebSocket not open. State:', wsRef.current?.readyState);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Close WebSocket gracefully when page is about to unload (refresh/navigation)
    const handleBeforeUnload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (import.meta.env.DEV) {
          console.log('🔌 Page unloading, closing WebSocket gracefully...');
        }
        try {
          // Try to send close frame before page unloads
          // Use a small timeout to allow the close to be sent
          wsRef.current.close(1000, 'Page unloading');
        } catch (e) {
          // Ignore errors - page is unloading anyway
        }
      }
    };
    
    // Also handle visibility change (tab switch) - might indicate refresh coming
    const handleVisibilityChange = () => {
      if (document.hidden && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Tab hidden - could be refresh, but don't close yet
        // Just log for debugging
        if (import.meta.env.DEV) {
          console.log('👁️ Tab hidden, WebSocket still open');
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      connectingRef.current = false; // Clear guard
      if (connectionTimeoutRef.current !== null) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (connectionCheckIntervalRef.current !== null) {
        clearInterval(connectionCheckIntervalRef.current);
        connectionCheckIntervalRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // Ignore
        }
        wsRef.current = null;
        onOpenCallbackRef.current = null;
      }
    };
  }, []);

  return {
    connected,
    connecting,
    messages,
    send,
    sendJson,
    connect,
    disconnect,
  };
}
