import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import fixtures from './fixtures/alerts.json';

// Code.gs is plain Apps Script; load it into a sandbox with just the globals the pure functions touch.
const ctx = vm.createContext({
  Utilities: { formatDate: (d: Date) => d.toISOString().slice(0, 10) },
  Session: { getScriptTimeZone: () => 'UTC' },
  Logger: { log() {} },
});
vm.runInContext(
  readFileSync(new URL('./Code.gs', import.meta.url), 'utf8') +
    // Stands in for the Sheet's Cards tab (made-up digits).
    ";CARDS_BY_LAST4 = { '1111': 'Card One', '2222': 'Card Two', '3333': 'Card Three' };" +
    ";CARD_KEYWORDS = [[keywordPattern(['blue']), 'Card Two']];" +
    ';globalThis.parse = parseTransactionEmail; globalThis.matches = matchesExisting;',
  ctx,
);
const { parse, matches } = ctx as unknown as {
  parse: (from: string, subject: string, body: string, html: string, date: Date) => unknown;
  matches: (tx: object, existing: object[]) => boolean;
};

describe('parseTransactionEmail', () => {
  for (const f of fixtures) {
    test(f.name, () => {
      const got = parse(f.email.from, f.email.subject, f.email.body, '', new Date('2031-03-14T12:00:00Z'));
      expect(got).toEqual(f.expected === null ? null : { date: '2031-03-14', ...f.expected });
    });
  }
});

describe('matchesExisting', () => {
  const statementRow = { date: '2031-03-10', amount: 42.42, card: 'Card Three' };

  test('alert within the window of a statement row on the same card is a duplicate', () => {
    expect(matches({ date: '2031-03-12', amount: 42.42, card: 'Card Three' }, [statementRow])).toBe(true);
  });

  test('same amount outside the window is a new transaction', () => {
    expect(matches({ date: '2031-03-15', amount: 42.42, card: 'Card Three' }, [statementRow])).toBe(false);
  });

  test('same amount on a different card is a new transaction', () => {
    expect(matches({ date: '2031-03-10', amount: 42.42, card: 'Card One' }, [statementRow])).toBe(false);
  });
});
