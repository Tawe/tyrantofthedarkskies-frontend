// Configuration for Tyrant of the Dark Skies Web Client
const config = {
    // Fly.io app name - update this if your app name changes
    flyAppName: 'tyrant-of-dark-skies',
    
    // WebSocket URLs for different environments
    urls: {
        development: 'ws://localhost:5557',
        production: null // Will be generated from flyAppName
    },
    
    /**
     * Get the WebSocket URL for the specified environment
     * @param {string} env - 'development' or 'production'
     * @returns {string} WebSocket URL
     */
    getWebSocketUrl(env = 'development') {
        if (env === 'production') {
            // Generate production URL from Fly.io app name. Use 443 (omit :5557): Fly terminates TLS only on 443.
            return this.urls.production || `wss://${this.flyAppName}.fly.dev`;
        }
        return this.urls.development;
    }
};
