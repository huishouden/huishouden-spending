import { useCallback, useEffect, useRef, useState } from 'react';
import { checkAlerts } from '../lib/alertSync';
import { gmailError } from '@huishouden/pwa-kit/gmail';
import type { SpendingStore } from './store';

export type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'done'; added: number; duplicates: number }
  | { status: 'error'; message: string };

/**
 * Email checks for card alerts. `check()` from a tap may ask Google for access; the automatic check
 * when the app opens only uses access granted in the last hour, so it never opens a window.
 */
export function useEmailCheck(store: SpendingStore) {
  const [state, setState] = useState<CheckState>({ status: 'idle' });
  const running = useRef(false);
  const storeRef = useRef(store);
  storeRef.current = store;

  const check = useCallback(async (interactive = true) => {
    if (running.current) return;
    running.current = true;
    try {
      const s = storeRef.current;
      const box = s.mail.stored() ?? (interactive ? await s.mail.request() : null);
      if (!box) return;
      setState({ status: 'checking' });
      const result = await checkAlerts(box, {
        cards: s.cards,
        labels: s.settings.alertLabels,
        rules: s.rules,
        existing: s.records,
        seen: s.mail.seen(),
      });
      await s.actions.addAlerts(result.create);
      await s.actions.recordEmailCheck();
      s.mail.markSeen(result.read);
      setState({ status: 'done', added: result.create.length, duplicates: result.duplicates });
    } catch (e) {
      setState({ status: 'error', message: gmailError(e) });
    } finally {
      running.current = false;
    }
  }, []);

  // Once per open, for a live household whose cards have alert words, when access is still fresh.
  const autoChecked = useRef(false);
  const ready = store.live && store.ready && store.cards.some((c) => c.alertWords.length > 0);
  useEffect(() => {
    if (!ready || autoChecked.current) return;
    autoChecked.current = true;
    if (store.mail.stored()) void check(false);
  }, [ready, store, check]);

  return { state, check };
}
