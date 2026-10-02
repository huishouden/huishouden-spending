import { expect, test } from 'bun:test';
import { checkAlerts, NothingToSearch } from './alertSync';
import { DEFAULT_RULES } from './categorise';
import type { Mailbox, MailMessage } from './mail';

const day = (d: number) => new Date(2031, 2, d, 9).getTime();
const messages: MailMessage[] = [
  { id: 'm3', date: day(14), from: 'alerts@bank.example.com', subject: 'Transaction alert', text: 'You made a $23.40 transaction with NOODLE BAR on your card ending in 2222' },
  { id: 'm2', date: day(13), from: 'alerts@bank.example.com', subject: 'Payment', text: 'We received your payment of $100.00' },
  { id: 'm1', date: day(12), from: 'alerts@bank.example.com', subject: 'Transaction alert', text: 'You made a $42.42 transaction with BOOKSHOP on your card ending in 1111' },
  { id: 'm0', date: day(11), from: 'alerts@bank.example.com', subject: 'Transaction alert', text: 'You made a $5.00 transaction with KIOSK on your card ending in 1111' },
];
const searches: string[] = [];
const reads: string[] = [];
const mailbox: Mailbox = {
  async search(q) {
    searches.push(q);
    return messages.map((m) => m.id);
  },
  async get(id) {
    reads.push(id);
    return messages.find((m) => m.id === id)!;
  },
};
const cards = [
  { name: 'Card One', last4: '1111', alertWords: ['alerts@bank.example.com'] },
  { name: 'Card Two', last4: '2222', alertWords: ['alerts@bank.example.com'] },
];

test('reads unseen alerts, skips payments and purchases already recorded', async () => {
  const existing = [
    // The statement row for the bookshop purchase, two days before the alert.
    { id: 'st-x', date: '2031-03-10', description: 'BOOKSHOP #12', amount: 42.42, card: 'Card One', source: 'statement' },
    // The kiosk alert another member's check already wrote.
    { id: 'al-m0', date: '2031-03-11', description: 'KIOSK', amount: 5, card: 'Card One', source: 'alert' },
  ];
  const result = await checkAlerts(mailbox, { cards, labels: [], rules: DEFAULT_RULES, existing });
  expect(searches).toEqual(['newer_than:30d (from:(alerts@bank.example.com))']);
  expect(reads.sort()).toEqual(['m1', 'm2', 'm3']);
  expect(result.found).toBe(4);
  expect(result.notPurchases).toBe(1);
  expect(result.duplicates).toBe(1);
  expect(result.create).toEqual([
    { id: 'al-m3', emailId: 'm3', date: '2031-03-14', description: 'NOODLE BAR', amount: 23.4, category: 'Miscellaneous', card: 'Card Two', type: 'Sale', last4: '2222' },
  ]);
  expect(result.read.sort()).toEqual(['m1', 'm2', 'm3']);
});

test('emails read in an earlier check are not read again', async () => {
  reads.length = 0;
  await checkAlerts(mailbox, { cards, labels: [], rules: [], existing: [], seen: new Set(['m0', 'm1', 'm2']) });
  expect(reads).toEqual(['m3']);
});

test('nothing to search for is said in words', async () => {
  expect(checkAlerts(mailbox, { cards: [{ name: 'Card One', alertWords: [] }], labels: [], rules: [], existing: [] })).rejects.toBeInstanceOf(NothingToSearch);
});
