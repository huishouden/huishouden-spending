import { Download, FileUp, RefreshCw, Tablet } from 'lucide-react';
import type { SpendingStore } from '../data/store';
import type { CheckState } from '../data/useEmailCheck';
import { ErrorNotice, primaryButton, secondaryButton } from './ui';

/** "5 minutes ago", "3 hours ago", "2 days ago". */
export function agoWords(at: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - at) / 60_000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

const who = (email: string | undefined, me: string) => (!email ? 'someone' : email === me ? 'you' : email.split('@')[0]);

interface Props {
  store: SpendingStore;
  state: CheckState;
  onCheck: () => void;
  onImport: () => void;
  onAddCards: () => void;
  onOpenPixelGuide?: () => void;
  install?: { available: boolean; onInstall: () => void };
}

/** Where the numbers come from: when email was last checked, and the two ways to bring spending in. */
export function DataBar({ store, state, onCheck, onImport, onAddCards, onOpenPixelGuide, install }: Props) {
  const canSearch = store.cards.some((c) => c.alertWords.length > 0) || store.settings.alertLabels.length > 0;
  let line: string;
  if (state.status === 'checking') line = 'Checking email for card alerts';
  else if (state.status === 'done')
    line = `Checked email just now; ${state.added === 0 ? 'nothing new' : `${state.added} new card charge${state.added === 1 ? '' : 's'}`}`;
  else if (!canSearch) line = store.cards.length ? "Add the address each card's alerts come from to check email for them" : 'Add your cards to bring in their alerts and statements';
  else if (store.settings.emailCheckedAt) line = `Email checked ${agoWords(store.settings.emailCheckedAt)} by ${who(store.settings.emailCheckedBy, store.me)}`;
  else line = 'Email not checked yet';
  const firstTime = store.live && canSearch && !store.mail.stored();

  return (
    <section aria-label="Bringing spending in" className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 dark:border-forest-600 dark:bg-forest-800">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="min-w-0 flex-1 text-base text-stone-600 dark:text-stone-300" aria-live="polite">
          {line}
        </p>
        <div className="flex flex-wrap gap-2">
          {canSearch ? (
            <button type="button" className={primaryButton} onClick={onCheck} disabled={state.status === 'checking'}>
              <RefreshCw size={18} className={state.status === 'checking' ? 'motion-safe:animate-spin' : ''} /> Check email
            </button>
          ) : (
            <button type="button" className={primaryButton} onClick={onAddCards}>
              {store.cards.length ? 'Add alert addresses' : 'Add your cards'}
            </button>
          )}
          <button type="button" className={secondaryButton} onClick={onImport}>
            <FileUp size={18} /> Import a statement
          </button>
          {onOpenPixelGuide && (
            <button type="button" className={secondaryButton} onClick={onOpenPixelGuide}>
              <Tablet size={18} /> Tablet setup
            </button>
          )}
          {install?.available && (
            <button type="button" className={secondaryButton} onClick={install.onInstall}>
              <Download size={18} /> Install
            </button>
          )}
        </div>
      </div>
      {firstTime && <p className="text-sm text-stone-600 dark:text-stone-300">Google will warn that the app is unverified the first time. Spending only reads card alert emails and never changes your mail.</p>}
      {state.status === 'error' && <ErrorNotice message={state.message} onRetry={onCheck} />}
    </section>
  );
}
