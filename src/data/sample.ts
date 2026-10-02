import { useMemo, useRef, useState } from 'react';
import type { Mailbox, MailMessage } from '../lib/mail';
import { MOCK_CARD_TRANSACTIONS } from '../services/mockData';
import { gmailMailbox, gmailTestToken } from './gmail';
import { cardDoc, DEFAULT_SPEND_SETTINGS, ruleDoc, type SpendSettings } from './model';
import { applyWrites, DEFAULT_RULE_DOCS, derive, emptyDocs, makeActions, type Docs, type SpendingStore } from './store';

/**
 * The signed-out app: an invented household with its own cards, rules and transactions, kept in
 * memory, so every screen (settings, statement import, email check) can be tried and screenshotted.
 * Nothing is saved; a reload starts over.
 */

const SAMPLE_ME = 'sample@example.com';

export const SAMPLE_CARDS = [
  { id: 'c-sample-1', name: 'Example Visa', last4: '1111', issuer: 'Example Bank', alertWords: ['alerts@bank.example.com'] },
  { id: 'c-sample-2', name: 'Example Rewards Card', last4: '2222', issuer: 'Example Card Co', alertWords: ['notices@card.example.com', 'rewards card'] },
  { id: 'c-sample-3', name: 'Example Everyday Card', last4: '3333', issuer: 'Example Bank', alertWords: ['alerts@bank.example.com'] },
];

export function sampleDocs(): Docs {
  const docs = emptyDocs();
  for (const t of MOCK_CARD_TRANSACTIONS) {
    docs.spendingTransactions.set(t.id, {
      date: t.date,
      description: t.merchant,
      amount: t.amount,
      category: t.category,
      card: t.cardName,
      type: t.amount < 0 ? 'Return' : 'Sale',
      source: 'statement',
    });
  }
  for (const { id, ...c } of SAMPLE_CARDS) docs.spendingCards.set(id, cardDoc(c, SAMPLE_ME, 0));
  for (const { id, ...r } of DEFAULT_RULE_DOCS) docs.spendingRules.set(id, ruleDoc(r, SAMPLE_ME, 0));
  docs.settings = { ...DEFAULT_SPEND_SETTINGS, updatedAt: 0, updatedBy: SAMPLE_ME };
  return docs;
}

/** Two card alerts and a payment notice from the last two days, so "Check email" always finds something. */
export function sampleMailbox(now = Date.now()): Mailbox {
  const hours = (h: number) => now - h * 3_600_000;
  const messages: MailMessage[] = [
    {
      id: 'sample-alert-1',
      date: hours(3),
      from: 'Example Card Co <notices@card.example.com>',
      subject: 'You made a $23.40 transaction',
      text: 'You made a $23.40 transaction with EXAMPLE NOODLE BAR on your card ending in 2222.',
    },
    {
      id: 'sample-alert-2',
      date: hours(26),
      from: 'Example Bank <alerts@bank.example.com>',
      subject: 'Purchase alert',
      text: 'You spent $61.15 at EXAMPLE GROCERY with your card ending in 1111.',
    },
    {
      id: 'sample-alert-3',
      date: hours(30),
      from: 'Example Bank <alerts@bank.example.com>',
      subject: 'Payment received',
      text: 'We received your payment of $500.00. Thank you for your payment.',
    },
  ];
  return {
    search: async () => messages.map((m) => m.id),
    get: async (id) => messages.find((m) => m.id === id)!,
  };
}

/** The sample household's store. Browser tests can point it at a stubbed Gmail with window.__gmailTestToken. */
export function useSampleStore(): SpendingStore & { reset: () => void } {
  const [docs, setDocs] = useState<Docs>(sampleDocs);
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const seen = useRef(new Set<string>());
  const settings: SpendSettings = DEFAULT_SPEND_SETTINGS;

  const actions = useMemo(
    () =>
      makeActions(
        () => derive(docsRef.current, settings),
        SAMPLE_ME,
        async (writes) => {
          docsRef.current = applyWrites(docsRef.current, writes);
          setDocs(docsRef.current);
        },
      ),
    // The fallback never changes for the sample.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const mail = useMemo(() => {
    const box = () => {
      const token = gmailTestToken();
      return token ? gmailMailbox(token) : sampleMailbox();
    };
    return {
      stored: box,
      request: async () => box(),
      seen: () => seen.current,
      markSeen: (ids: string[]) => ids.forEach((id) => seen.current.add(id)),
    };
  }, []);
  const derived = useMemo(() => derive(docs, settings), [docs, settings]);
  const reset = () => {
    docsRef.current = sampleDocs();
    seen.current.clear();
    setDocs(docsRef.current);
  };
  return { live: false, ready: true, me: SAMPLE_ME, ...derived, actions, mail, reset };
}
