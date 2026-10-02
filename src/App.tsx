import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { signInSilently } from '@huishouden/pwa-kit/auth';
import { markJoined, saveMyProfile, watchHousehold, type HouseholdState } from '@huishouden/pwa-kit/household';
import { popupCancelled } from '@huishouden/pwa-kit/feedback';
import { ClockProvider } from '@huishouden/pwa-kit/react/clock';
import { cardClass, primaryButton, useToast } from '@huishouden/pwa-kit/react/ui';
import { auth, googleClientId, signInWithGoogle, signOutEverywhere } from './services/auth';
import { getDb } from './services/firestoreTransactions';
import { useLiveStore } from './data/useLiveStore';
import { SAMPLE_NOW, useSampleStore } from './data/sample';
import { DEFAULT_SPEND_SETTINGS } from './data/model';
import { PORTAL_URL } from './config/portal';
import { Frame, SpendingApp, type FrameProps } from './SpendingApp';

/** Who is here decides what shows: the sample household, a "not in a household yet" note, or the household's own spending. */
export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Signs in without a click when the browser is signed in to Google and has used the app before.
  useEffect(() => {
    if (googleClientId) void signInSilently(auth, googleClientId);
  }, []);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (!popupCancelled(e)) setSignInError("Couldn't sign in. Try again.");
    } finally {
      setSigningIn(false);
    }
  }, []);
  const signOut = useCallback(() => void signOutEverywhere(), []);
  const frame: FrameProps = { user, onSignIn: signIn, onSignOut: signOut, signingIn };

  if (user === undefined) return <Frame {...frame} />;
  if (user === null) return <SampleApp frame={frame} signInError={signInError} />;
  return <SignedIn key={user.uid} user={user} frame={frame} />;
}

function SignedIn({ user, frame }: { user: User; frame: FrameProps }) {
  const email = (user.email ?? '').toLowerCase();
  const [state, setState] = useState<HouseholdState>({ status: 'loading' });
  useEffect(() => (email ? watchHousehold(getDb(), email, setState) : undefined), [email]);
  const household = state.status === 'ready' ? state.household : null;
  useEffect(() => {
    if (!household) return;
    markJoined(getDb(), household, email).catch(() => {});
    // Members' names and photos come from their own sign-ins (shown in the portal).
    saveMyProfile(getDb(), household.id, user).catch(() => {});
  }, [household, email, user]);

  if (state.status === 'ready') return <LiveApp householdId={state.household.id} email={email} frame={frame} />;
  if (state.status === 'loading') return <Note frame={frame}>Finding your household.</Note>;
  if (state.status === 'error') return <Note frame={frame}>Couldn't reach the household. Check the connection; the app tries again on its own.</Note>;
  return (
    <Note frame={frame}>
      <h2 className="text-2xl font-semibold text-stone-800">Not in a household yet</h2>
      <p className="mt-2">
        {user.email} isn't in a Huishouden household. Start one on the Huishouden home screen, or ask someone in your household to invite this address, then
        open Spending again.
      </p>
      <a className={`${primaryButton} mt-5`} href={PORTAL_URL}>
        Open Huishouden
      </a>
    </Note>
  );
}

function LiveApp({ householdId, email, frame }: { householdId: string; email: string; frame: FrameProps }) {
  const toasts = useToast();
  const store = useLiveStore(householdId, email, DEFAULT_SPEND_SETTINGS, toasts.fail);
  return (
    <ClockProvider read={Date.now}>
      <SpendingApp store={store} frame={frame} toasts={toasts} />
    </ClockProvider>
  );
}

/** Signed out: an invented household on its own clock, kept in memory, so the app can be tried and screenshotted. */
function SampleApp({ frame, signInError }: { frame: FrameProps; signInError: string | null }) {
  const loadedAt = useMemo(() => Date.now(), []);
  const read = useCallback(() => SAMPLE_NOW + (Date.now() - loadedAt), [loadedAt]);
  const toasts = useToast();
  const store = useSampleStore(read);
  const banner = (
    <div className={`${cardClass} flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5`} role="note">
      <span className="rounded-full bg-terracotta-light px-3 py-1 text-sm font-semibold text-terracotta-dark">Sample data</span>
      <p className="min-w-0 flex-1 text-base text-stone-600">{signInError ?? 'An invented household. Nothing is saved. Sign in to see your household’s own spending.'}</p>
    </div>
  );
  return (
    <ClockProvider read={read}>
      <SpendingApp store={store} frame={frame} toasts={toasts} banner={banner} />
    </ClockProvider>
  );
}

function Note({ frame, children }: { frame: FrameProps; children: ReactNode }) {
  return (
    <Frame {...frame}>
      <div className={`${cardClass} max-w-2xl p-6 text-lg text-stone-600`}>{children}</div>
    </Frame>
  );
}
