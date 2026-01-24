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
      // Generate production URL from Fly.io app name
      return this.urls.production || `wss://${this.flyAppName}.fly.dev:5557`;
    }
    return this.urls.development;
  },
  
  /**
   * Auto-detect environment and return appropriate URL
   */
  getDefaultWebSocketUrl(): string {
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
