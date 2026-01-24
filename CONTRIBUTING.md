# Contributing to Tyrant of the Dark Skies Frontend

Thank you for your interest in contributing!

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/tyrantofthedarkskies-frontend.git
   cd tyrantofthedarkskies-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase (required for authentication):**
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration (see [docs/firebase-setup.md](docs/firebase-setup.md))

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Code Style

- Use TypeScript for all new code
- Follow React best practices (hooks, functional components)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep console.log statements wrapped in `import.meta.env.DEV` checks

## Testing

- Run tests: `npm test`
- Run tests with UI: `npm run test:ui`
- Take screenshots for debugging: `npm run screenshot`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request with a clear description

## Questions?

Check the documentation in the `docs/` folder or open an issue.
