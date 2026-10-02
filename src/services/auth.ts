import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { firebaseConfigFromEnv } from '@piekstra/pwa-kit/firebase';

// From VITE_FIREBASE_* build variables: CI sets them from repo variables; locally run
// `bun run env:pull` to write them to .env.local.
const firebaseConfig = firebaseConfigFromEnv(import.meta.env);

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseApp = app;
// getAuth persists the session in IndexedDB (indexedDBLocalPersistence), so a device stays
// signed in across reloads and restarts until someone signs out.
export const auth = getAuth(app);

// Provider with required scopes for Google Sheets and Google Drive
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Sign-in with no Google API scopes, for the Firestore data source: no "unverified app" screen
// and no hourly access token, because the browser never calls Google APIs directly.
const basicProvider = new GoogleAuthProvider();
basicProvider.setCustomParameters({ prompt: 'select_account' });

export const googleSignInBasic = async (): Promise<User> => {
  const result = await signInWithPopup(auth, basicProvider);
  return result.user;
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// In-memory cache for OAuth access token (per security requirements: never in localStorage)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Check if the currently cached access token is present and not expired
 */
export const hasValidAccessToken = (): boolean => {
  if (!cachedAccessToken) return false;
  if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
    cachedAccessToken = null;
    tokenExpiresAt = null;
    return false;
  }
  return true;
};

/**
 * Manually set access token in memory (e.g. from popup callback)
 */
export const setCachedAccessToken = (token: string | null, expiresInSeconds = 3600) => {
  cachedAccessToken = token;
  tokenExpiresAt = token ? Date.now() + (expiresInSeconds - 60) * 1000 : null;
};

/**
 * Initialize auth state listener. Call this on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (hasValidAccessToken()) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged in via Firebase Auth, but in-memory access token might not be set yet if reloaded
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      tokenExpiresAt = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup and retrieve access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No Google Workspace access token received. Please try again.');
    }

    setCachedAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: unknown) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (hasValidAccessToken()) {
    return cachedAccessToken;
  }
  return null;
};

/**
 * Sign out and clear in-memory token
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  tokenExpiresAt = null;
};
