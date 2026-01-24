import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';

export function FirebaseDebug() {
  const [status, setStatus] = useState<string>('Checking...');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const checkFirebase = () => {
      if (!auth) {
        setStatus('❌ Firebase Auth is not initialized');
        setConfig({
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'NOT SET',
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'NOT SET',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'NOT SET',
        });
        return;
      }

      setStatus('✅ Firebase Auth is initialized');
      setConfig({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? `${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10)}...` : 'NOT SET',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'NOT SET',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'NOT SET',
      });
    };

    checkFirebase();
  }, []);

  if (!import.meta.env.DEV) {
    return null; // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#111',
      border: '1px solid #0f0',
      padding: '10px',
      fontSize: '12px',
      color: '#0f0',
      zIndex: 9999,
      maxWidth: '300px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Firebase Debug</div>
      <div style={{ marginBottom: '5px' }}>{status}</div>
      {config && (
        <div style={{ fontSize: '10px', color: '#0aa' }}>
          <div>API Key: {config.apiKey}</div>
          <div>Auth Domain: {config.authDomain}</div>
          <div>Project ID: {config.projectId}</div>
        </div>
      )}
    </div>
  );
}
