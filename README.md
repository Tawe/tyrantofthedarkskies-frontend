# Tyrant of the Dark Skies - Frontend

Web client for the Tyrant of the Dark Skies MUD (Multi-User Dungeon).

## 📦 Two Versions Available

This repository contains **two versions** of the client:

1. **Vanilla JS** (`index-vanilla.html`) - Simple, no build step required
2. **React** (`index.html` + `src/`) - Modern, extensible, component-based (default)

### Which Should You Use?

- **Vanilla JS**: Perfect for quick setup, simple deployments, or if you don't need advanced features
- **React**: Recommended for adding quality-of-life features (inventory panels, stats sidebar, chat windows, etc.)

See [README-REACT.md](README-REACT.md) for React setup instructions.

## 🚀 Quick Start

### React Version (Default)

The React version is now the default. See [README-REACT.md](README-REACT.md) for setup instructions.

```bash
npm install
npm run dev
```

### Vanilla JS Version

To use the vanilla JS version:

1. **Open the client:**
   - Simply open `index-vanilla.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python3 -m http.server 8000
     
     # Using Node.js (if you have it)
     npx serve .
     ```

2. **Connect to the server:**
   - Enter WebSocket URL (default: `ws://localhost:5557` for local development)
   - Click "Connect"
   - Enter your email/password when prompted
   - Start playing!

### Production

The client automatically detects the environment:
- **Localhost**: Uses `ws://localhost:5557`
- **Production**: Uses `wss://tyrant-of-dark-skies.fly.dev` (port 443; Fly terminates TLS only on 443, not on :5557)

To change the production server URL, edit `config.js` and update the `flyAppName` property.

## 📁 Project Structure

```
tyrantofthedarkskies-frontend/
├── index.html          # Main client interface
├── config.js           # Configuration (WebSocket URLs, etc.)
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── docs/               # Documentation
    └── setup.md        # Setup guide
```

## ⚙️ Configuration

### WebSocket URL

The WebSocket URL is automatically configured based on your environment:

- **Development**: `ws://localhost:5557` (when running on localhost)
- **Production**: `wss://tyrant-of-dark-skies.fly.dev` (when hosted; port 443)

To customize, edit `config.js`:

```javascript
const config = {
    flyAppName: 'your-app-name',  // Change this for different Fly.io apps
    urls: {
        development: 'ws://localhost:5557',
        production: 'wss://your-custom-url.com'  // Or leave null for auto-generation; use 443 for Fly
    }
};
```

### Local Storage

The client saves your WebSocket URL preference in browser local storage, so you don't have to re-enter it each time.

## 🎮 Features

- **Real-time WebSocket Connection**: Direct connection to the MUD server
- **Command History**: Use arrow keys to navigate previous commands
- **ANSI Color Support**: Full support for colored text output
- **Responsive Design**: Works on desktop and mobile browsers
- **Auto-reconnect**: Automatically shows connection dialog on disconnect

## 🛠️ Development

### No Build Process Required

This is a pure HTML/CSS/JavaScript client with no build step needed. Just edit the files and refresh your browser!

### Testing & Screenshots with Playwright

The project includes Playwright for automated testing and taking screenshots for debugging:

```bash
# Install Playwright (first time only)
npm install
npx playwright install

# Take a screenshot of the app
npm run screenshot

# Run all tests
npm test

# Run tests with UI (interactive)
npm run test:ui
```

See [docs/playwright-setup.md](docs/playwright-setup.md) for detailed instructions.

### Future Enhancements

Potential improvements for the future:
- Split into modules (WebSocket, UI, commands)
- Add build system (Vite, Webpack) for optimization
- Extract CSS to separate file
- Add TypeScript support
- Mobile app (React Native, etc.)

## 🚢 Deployment

### Static Hosting (Recommended)

Deploy to any static hosting service:

- **Netlify**: Connect GitHub repo, auto-deploys
- **Vercel**: Connect GitHub repo, auto-deploys  
- **GitHub Pages**: Enable in repo settings
- **Cloudflare Pages**: Connect repo, auto-deploys

### Custom Domain

All static hosts support custom domains. Point your DNS to your hosting provider.

### Environment Variables

For the React version, you can set environment variables in `.env`:

```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=tyrant-of-dark-skies.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tyrant-of-dark-skies

# WebSocket URL (Optional - auto-detects if not set)
VITE_WEBSOCKET_URL=wss://tyrant-of-dark-skies.fly.dev
```

**For Netlify/Vercel deployments:**
- Set these as environment variables in your hosting platform's dashboard
- The WebSocket URL will be auto-detected, but you can override with `VITE_WEBSOCKET_URL`

## 🔗 Backend Repository

The backend server is located at:
- Repository: `tyrantofthedarkskies`
- WebSocket Port: `5557`
- Default Local URL: `ws://localhost:5557`

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🙏 Acknowledgments

- Built with vanilla HTML, CSS, and JavaScript
- Connects to Python WebSocket server
- Inspired by classic MUD clients

---

**Ready to play?** Open `index.html` and connect to your server!
