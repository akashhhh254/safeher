import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export interface AuthSuccessResult {
  user: User;
  provider: 'google' | 'password' | 'demo';
}

/**
 * Sign in using official Google OAuth popup
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (err: any) {
    console.error('Google Sign-In error:', err);
    throw err;
  }
}

/**
 * Sign in with standard Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return cred.user;
}

/**
 * Register a new user with Name, Email, and Password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cleanEmail = email.trim();
  const cleanName = name.trim();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  if (cleanName && cred.user) {
    await updateProfile(cred.user, { displayName: cleanName });
  }
  return cred.user;
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim();
  await sendPasswordResetEmail(auth, cleanEmail);
}

/**
 * Instant 1-Click Demo Sign-in for immediate client demonstrations
 */
export async function signInDemoAccount(
  displayName = 'Akash Thakare',
  email = 'akashthakare157@gmail.com'
): Promise<User> {
  try {
    // Try sign in with deterministic demo credential or anonymous
    const cred = await signInAnonymously(auth);
    await updateProfile(cred.user, {
      displayName: displayName,
    });
    return cred.user;
  } catch (err) {
    console.warn('Anonymous demo fallback error:', err);
    throw err;
  }
}

/**
 * Helper to translate Firebase Auth errors into clear, friendly messages
 */
export function getFriendlyAuthErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const code = err.code || '';

  switch (code) {
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site, or sign in using email & password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in popup was closed. Please click Continue with Google again.';
    case 'auth/unauthorized-domain':
      return 'Domain authorization pending in Google Cloud. You can sign in using Email & Password or 1-Click Client Demo.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please switch to the "Register" tab to create one.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please switch to "Sign In" or reset your password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      return err.message || 'Authentication failed. Please check your credentials and try again.';
  }
}
