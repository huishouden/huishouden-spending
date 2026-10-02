import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { firebaseConfigFromEnv } from '@huishouden/pwa-kit/firebase';
import { configureGoogleTokens } from '@huishouden/pwa-kit/google-token';
import { forgetSilentSignIn } from '@huishouden/pwa-kit/auth';
import { startObservability } from '@huishouden/pwa-kit/observability';

// From VITE_FIREBASE_* build variables: CI sets them from repo variables; locally run
// `bun run env:pull` to write them to .env.local.
export const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfigFromEnv(import.meta.env));
// getAuth keeps the session in IndexedDB, so the tablet stays signed in across restarts.
export const auth = getAuth(firebaseApp);
// Error, speed and anonymous usage reports (the portal's /privacy page); off without VITE_NEWRELIC_*.
startObservability({ app: 'spending', env: import.meta.env });
export const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;
// Gmail and Sheets tokens come from Google Identity Services with the OAuth web client, not from
// Firebase sign-in (see @huishouden/pwa-kit/google-token).
configureGoogleTokens({ clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID });

/** Plain Google sign-in: no Google API scopes, so no "unverified app" screen. Gmail is asked for separately, from a tap. */
export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}

export async function signOutEverywhere(): Promise<void> {
  await forgetSilentSignIn();
  await signOut(auth);
}
