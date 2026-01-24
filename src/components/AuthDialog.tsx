import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthDialog.css';

interface AuthDialogProps {
  onAuthenticated: (email: string, password: string, characterName?: string, idToken?: string | null) => void;
}

export function AuthDialog({ onAuthenticated }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register, getIdToken } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate password for registration
      if (!isLogin) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        if (!characterName || characterName.trim().length < 2) {
          setError('Character name must be at least 2 characters');
          setLoading(false);
          return;
        }
      }

      // Try Firebase auth if available
      let idToken: string | null = null;
      let firebaseSuccess = false;
      
      try {
        if (isLogin) {
          await login(email, password);
          // Wait a bit for the user to be set, then get token
          await new Promise(resolve => setTimeout(resolve, 100));
          idToken = await getIdToken();
          firebaseSuccess = true;
          console.log('✅ Firebase login successful');
        } else {
          // For registration, we MUST create the Firebase account first
          await register(email, password);
          // Wait a bit for the user to be set, then get token
          await new Promise(resolve => setTimeout(resolve, 100));
          idToken = await getIdToken();
          
          // If token is still null, try one more time after a longer delay
          if (!idToken) {
            console.log('⏳ Token not ready, waiting a bit more...');
            await new Promise(resolve => setTimeout(resolve, 300));
            idToken = await getIdToken();
          }
          
          if (idToken) {
            firebaseSuccess = true;
            console.log('✅ Firebase registration successful, token obtained');
          } else {
            console.warn('⚠️ Token not available after registration, but proceeding anyway');
            firebaseSuccess = true; // Still proceed, server can handle it
          }
        }
      } catch (firebaseError: any) {
        // If Firebase fails, show error to user
        console.error('❌ Firebase auth failed:', firebaseError);
        
        // Provide more helpful error messages
        let errorMessage = firebaseError.message || 'Authentication failed';
        
        if (firebaseError.code === 'auth/invalid-credential') {
          if (isLogin) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else {
            errorMessage = 'This email is already registered. Try logging in instead.';
          }
        } else if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email. Please register first.';
        } else if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please log in instead.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address. Please check and try again.';
        } else if (firebaseError.code === 'auth/operation-not-allowed') {
          errorMessage = 'Email/Password authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.';
        } else if (firebaseError.message?.includes('API key')) {
          errorMessage = 'Firebase API key is invalid. Please check your .env file and restart the dev server.';
        }
        
        setError(errorMessage);
        setLoading(false);
        return; // Don't proceed if Firebase fails
      }

      // Only proceed if Firebase auth succeeded
      if (firebaseSuccess) {
        // Always call onAuthenticated with credentials
        // Server will handle authentication
        onAuthenticated(email, password, isLogin ? undefined : characterName.trim(), idToken);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setCharacterName('');
  };

  return (
    <div className="auth-dialog">
      <div className="auth-content">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Enter your email and password to connect'
            : 'Create a new account to start playing'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="characterName">Character Name:</label>
              <input
                id="characterName"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Tawe"
                required
                autoComplete="off"
                disabled={loading}
                minLength={2}
                maxLength={20}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              disabled={loading}
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? '...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="auth-toggle">
          <button type="button" onClick={toggleMode} disabled={loading}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
