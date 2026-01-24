// Firebase configuration
// Get these values from Firebase Console: Project Settings > General > Your apps

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// Project: tyrant-of-dark-skies
// Get Web API Key from Firebase Console > Project Settings > General > Your apps
// See docs/firebase-config-from-backend.md for details
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tyrant-of-dark-skies.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tyrant-of-dark-skies',
  // Optional, but recommended:
  // storageBucket: 'YOUR_PROJECT.appspot.com',
  // messagingSenderId: 'YOUR_SENDER_ID',
  // appId: 'YOUR_APP_ID',
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Debug: Log environment variables (without exposing sensitive data)
if (import.meta.env.DEV) {
  console.log('🔍 Firebase Config Check:');
  console.log('- API Key present:', !!import.meta.env.VITE_FIREBASE_API_KEY);
  console.log('- API Key starts with:', import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) || 'NOT SET');
  console.log('- API Key length:', import.meta.env.VITE_FIREBASE_API_KEY?.length || 0, '(should be ~39 characters)');
  console.log('- Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'NOT SET');
  console.log('- Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || 'NOT SET');
  
  // Validate API key format
  if (import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.startsWith('AIzaSy')) {
    console.warn('⚠️  WARNING: API Key should start with "AIzaSy". Please verify you copied the Web API Key from Firebase Console.');
  }
}

try {
  // Validate config before initializing
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    throw new Error('Firebase API Key not configured. Please set VITE_FIREBASE_API_KEY in .env file');
  }
  
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes('YOUR_PROJECT')) {
    throw new Error('Firebase Auth Domain not configured. Please set VITE_FIREBASE_AUTH_DOMAIN in .env file');
  }
  
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
    throw new Error('Firebase Project ID not configured. Please set VITE_FIREBASE_PROJECT_ID in .env file');
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  if (import.meta.env.DEV) {
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('Firebase Auth will not be available. Using email/password through WebSocket.');
  console.warn('Make sure your .env file is set up correctly and restart the dev server.');
}

export { app, auth };
export default firebaseConfig;
