import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Update user state immediately
      setUser(userCredential.user);
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update user state immediately
      setUser(userCredential.user);
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      return;
    }

    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      throw error;
    }
  };

  const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    if (!auth) {
      return null;
    }

    // If we have a user in state, use it
    if (user) {
      try {
        return await user.getIdToken(forceRefresh);
      } catch (err) {
        console.error('Error getting ID token from user:', err);
      }
    }

    // Fallback: get current user from auth
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        return await currentUser.getIdToken(forceRefresh);
      } catch (err) {
        console.error('Error getting ID token from currentUser:', err);
        return null;
      }
    }

    return null;
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getIdToken,
  };
}
