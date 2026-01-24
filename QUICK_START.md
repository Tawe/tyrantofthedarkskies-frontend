# Quick Start Guide

## Running the React App

**Important**: Make sure you're running the React version, not the vanilla JS version!

### Start the React App

```bash
cd /Users/johnmunn/Documents/projects/tyrantofthedarkskies-frontend
npm install  # If you haven't already
npm run dev
```

The app will open at **http://localhost:3000**

### What You Should See

1. **If not logged in**: Login/Register dialog (no connection dialog!)
2. **If already logged in**: Auto-connects and starts game

### If You See "Server Configuration" Dialog

You're probably viewing the **vanilla JS version** (`index.html`) instead of the React app.

**Solution:**
- Make sure you're running `npm run dev`
- Open **http://localhost:3000** (not opening `index.html` directly)
- The React app auto-detects localhost vs production

### Auto-Detection

The app automatically detects:
- **Localhost** → `ws://localhost:5557`
- **Production** → `wss://tyrant-of-dark-skies.fly.dev:5557`

No manual configuration needed!

## Troubleshooting

### Still seeing connection dialog?

1. **Check you're running React app:**
   ```bash
   npm run dev
   ```
   Should open at `http://localhost:3000`

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear site data in browser settings

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for "🌐 Auto-detected WebSocket URL" message
   - If you don't see it, you might be on the wrong version

### Connection Issues

- Make sure MUD server is running: `python3 mud_server.py`
- Check server is on port 5557
- Verify WebSocket URL in console logs
