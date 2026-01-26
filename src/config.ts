// Configuration for Tyrant of the Dark Skies Web Client
export const config = {
  // Fly.io app name - update this if your app name changes
  flyAppName: 'tyrant-of-dark-skies',
  
  // WebSocket URLs for different environments
  urls: {
    development: 'ws://localhost:5557',
    production: null as string | null, // Will be generated from flyAppName
  },
  
  /**
   * Get the WebSocket URL for the specified environment
   * @param env - 'development' or 'production'
   * @returns WebSocket URL
   */
  getWebSocketUrl(env: 'development' | 'production' = 'development'): string {
    if (env === 'production') {
      // Generate production URL from Fly.io app name.
      // Use port 443 (omit :5557): Fly terminates TLS only on 443; :5557 is raw TCP, so wss:// fails.
      return this.urls.production || `wss://${this.flyAppName}.fly.dev`;
    }
    return this.urls.development;
  },
  
  /**
   * Auto-detect environment and return appropriate URL
   */
  getDefaultWebSocketUrl(): string {
    // Allow override via environment variable (useful for Netlify, Vercel, etc.)
    if (typeof window !== 'undefined' && import.meta.env.VITE_WEBSOCKET_URL) {
      return import.meta.env.VITE_WEBSOCKET_URL;
    }
    
    // Check if we're on localhost (development)
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    ) {
      return this.getWebSocketUrl('development');
    }
    // For production (Fly.io or other hosting), use secure WebSocket
    return this.getWebSocketUrl('production');
  },
};
