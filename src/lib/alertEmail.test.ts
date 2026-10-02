import { describe, expect, test } from 'bun:test';
import scriptFixtures from '../../apps-script/fixtures/alerts.json';
import fixtures from './__fixtures__/alert-emails.json';
import { alertQuery, identifyCard, parseAlertEmail, type AlertCard } from './alertEmail';
import { DEFAULT_RULES } from './categorise';

// Invented cards: two share a sender, one has a sender of its own and a product word.
const cards: AlertCard[] = [
  { name: 'Card One', last4: '1111', alertWords: ['alerts@bank.example.com'] },
  { name: 'Card Two', last4: '2222', alertWords: ['alerts@bank.example.com', 'alerts@cardtwo.example.com', 'blue'] },
  { name: 'Card Three', last4: '3333', alertWords: [] },
];
const sent = new Date(2031, 2, 14, 12).getTime();

describe('parseAlertEmail', () => {
  for (const f of fixtures) {
    test(f.name, () => {
      const got: unknown = parseAlertEmail({ id: 'm1', date: sent, subject: f.email.subject, from: f.email.from, text: f.email.text, html: f.email.html }, cards, DEFAULT_RULES);
      expect(got).toEqual(f.expected === null ? null : { date: '2031-03-14', ...f.expected });
    });
  }
});

// The Apps Script's own fixtures: the browser reads every alert the script reads the same way
// (categories differ by design: the household's rules decide them now).
describe('reads the Apps Script fixtures like the script', () => {
  for (const f of scriptFixtures) {
    test(f.name, () => {
      const got = parseAlertEmail({ id: 'm1', date: sent, from: f.email.from, subject: f.email.subject, text: f.email.body }, cards, DEFAULT_RULES);
      if (f.expected === null) return expect(got).toBeNull();
      expect(got && { description: got.description, amount: got.amount, card: got.card, type: got.type }).toEqual({
        description: f.expected.description,
        amount: f.expected.amount,
        card: f.expected.card,
        type: f.expected.type as 'Sale' | 'Return',
      });
    });
  }
});

describe('alertQuery', () => {
  test('senders search From, other words are phrases, labels are labels; each once', () => {
    expect(alertQuery(cards, ['Bank/Card alerts'])).toBe(
      'newer_than:30d (from:(alerts@bank.example.com) OR from:(alerts@cardtwo.example.com) OR "blue" OR label:bank-card-alerts)',
    );
  });

  test('nothing to search for without alert words or labels', () => {
    expect(alertQuery([{ name: 'Card One', alertWords: [' '] }])).toBeNull();
  });

  test('characters that would change the search are removed', () => {
    expect(alertQuery([{ name: 'Card One', alertWords: ['"purchase" (alert)'] }], [], 7)).toBe('newer_than:7d ("purchase alert")');
  });
});

describe('identifyCard', () => {
  test('digits in the usual wordings', () => {
    for (const text of ['card ending in 3333', 'Card ends in 3333', 'Visa (...3333)', 'XXXX3333', 'used on Card 3333']) {
      expect(identifyCard(text, cards).card).toBe('Card Three');
    }
  });

  test('a product word only one card lists, as a whole word', () => {
    expect(identifyCard('your Blue card', cards).card).toBe('Card Two');
    expect(identifyCard('your bluebird card', cards).card).toBe('Unknown Card');
  });
});
