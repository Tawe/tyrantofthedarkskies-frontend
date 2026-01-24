import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  messages: string[];
  send: (message: string) => void;
  sendJson: (data: any) => void;
  connect: (url: string) => void;
  disconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback((url: string) => {
    // Prevent multiple connection attempts
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return; // Already connecting
    }
    
    // Clean up any existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // Ignore errors when closing
      }
      wsRef.current = null;
    }

    setConnecting(true);
    
    // Set a connection timeout (5 seconds)
    timeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        if (import.meta.env.DEV) {
          console.error('❌ WebSocket connection timeout after 5 seconds');
        }
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {
            // Ignore errors
          }
          wsRef.current = null;
        }
        setConnecting(false);
        setConnected(false);
      }
    }, 5000);
    
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Clear timeout on successful connection
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setConnected(true);
      setConnecting(false);
      if (import.meta.env.DEV) {
        console.log('✅ WebSocket connected successfully');
      }
    };

    ws.onerror = (error) => {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
      setMessages((prev) => [...prev, event.data]);
    };
    
    ws.onclose = (event) => {
      // Clear timeout on close
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (import.meta.env.DEV) {
        console.log('🔌 WebSocket closed:', event.code, event.reason || 'No reason');
      }
      setConnected(false);
      setConnecting(false);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
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
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
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
