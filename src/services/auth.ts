import { initApp } from '@huishouden/pwa-kit/app';

// From VITE_FIREBASE_* build variables: CI sets them from repo variables; locally run
// `bun run env:pull` to write them to .env.local. Auth kept in IndexedDB, observability, and Gmail
// and Sheets tokens from Google Identity Services (see @huishouden/pwa-kit/google-token).
// Sign-in is plain Google sign-in: no Google API scopes, so no "unverified app" screen; Gmail is
// asked for separately, from a tap.
export const firebase = initApp({ app: 'spending', env: import.meta.env });
export const { auth, googleClientId, signInWithGoogle, signOutEverywhere } = firebase;
