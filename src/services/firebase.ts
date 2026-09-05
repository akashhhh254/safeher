import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Resolves the authorized domain for Firebase Authentication:
 * Default to the project's official Firebase domain (gen-lang-client-0841274382.firebaseapp.com)
 * which has the registered Google OAuth 2.0 handler and redirect URIs.
 */
export function getAuthorizedAuthDomain(): string {
  const envAuthDomain = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN;
  if (envAuthDomain && typeof envAuthDomain === 'string' && envAuthDomain.trim().length > 0) {
    return envAuthDomain.trim();
  }

  return firebaseConfig.authDomain || 'gen-lang-client-0841274382.firebaseapp.com';
}

export const resolvedAuthDomain = getAuthorizedAuthDomain();

export const activeFirebaseConfig = {
  ...firebaseConfig,
  authDomain: resolvedAuthDomain,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(activeFirebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore with configured databaseId
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Connection verification per Firebase integration guidelines
export async function verifyFirebaseConnection(): Promise<boolean> {
  try {
    // Attempt a read to verify connection status
    await getDocFromServer(doc(db, '_health', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
      return false;
    }
    // If permission-denied or document-not-found, the server is reached and responding
    return true;
  }
}

// Initial verification on boot
verifyFirebaseConnection().catch(() => {
  // Silent catch on initial boot
});
