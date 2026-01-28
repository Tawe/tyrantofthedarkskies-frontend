# Tyrant of the Dark Skies - Frontend

Web client for the Tyrant of the Dark Skies MUD (Multi-User Dungeon).

## 🚀 Quick Start

This is a React-based web client built with Vite, TypeScript, and Firebase authentication.

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Production

The client automatically detects the environment:
- **Localhost**: Uses `ws://localhost:5557`
- **Production**: Uses `wss://tyrant-of-dark-skies.fly.dev` (port 443; Fly terminates TLS only on 443, not on :5557)

To change the production server URL, edit `config.js` and update the `flyAppName` property.

## 📁 Project Structure

```
tyrantofthedarkskies-frontend/
├── src/                # React source code
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── firebase/       # Firebase configuration
│   └── App.tsx         # Main app component
├── public/             # Static assets
├── tests/              # Playwright tests
├── README.md           # This file
└── .env                # Environment variables (not committed)
```

## ⚙️ Configuration

### WebSocket URL

The WebSocket URL is automatically configured based on your environment:

- **Development**: `ws://localhost:5557` (when running on localhost)
- **Production**: `wss://tyrant-of-dark-skies.fly.dev` (when hosted; port 443)

To override, set `VITE_WEBSOCKET_URL` in your `.env` file.

## 🎮 Features

- **Real-time WebSocket Connection**: Direct connection to the MUD server
- **Command History**: Use arrow keys to navigate previous commands
- **ANSI Color Support**: Full support for colored text output
- **Responsive Design**: Works on desktop and mobile browsers
- **Auto-reconnect**: Automatically shows connection dialog on disconnect

## 🛠️ Development

### Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

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

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase** - Authentication
- **WebSocket** - Real-time game communication
- **Playwright** - Testing framework

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

- Built with React, TypeScript, and Vite
- Connects to Python WebSocket server
- Inspired by classic MUD clients

---

**Ready to play?** Run `npm run dev` and connect to your server!
