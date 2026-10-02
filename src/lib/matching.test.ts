import { describe, expect, test } from 'bun:test';
import { alertId, planImport, sameTransaction, similarDescriptions, stableHash, statementIds, type Existing } from './matching';

const statement: Existing = { id: 'st-1', date: '2031-03-10', description: 'BOOKSHOP #12', amount: 42.42, card: 'Card Three', source: 'statement' };
const alert: Existing = { id: 'al-1', date: '2031-03-12', description: 'BOOKSHOP', amount: 42.42, card: 'Card Three', source: 'alert' };

// Shop names without the EXAMPLE prefix here: a shared word is what makes two descriptions alike.
describe("the Apps Script's rule (card, amount, 3 days) plus alike descriptions", () => {
  test('an alert within the window of a statement row on the same card is the same', () => {
    expect(sameTransaction({ date: '2031-03-12', description: 'BOOKSHOP', amount: 42.42, card: 'Card Three' }, statement)).toBe(true);
  });

  test('outside the window, on another card, or another amount it is not', () => {
    expect(sameTransaction({ ...alert, date: '2031-03-15' }, statement)).toBe(false);
    expect(sameTransaction({ ...alert, card: 'Card One' }, statement)).toBe(false);
    expect(sameTransaction({ ...alert, amount: 42.43 }, statement)).toBe(false);
  });

  test('a different shop charging the same amount is a different purchase', () => {
    expect(sameTransaction({ ...alert, description: 'NOODLE BAR' }, statement)).toBe(false);
  });

  test('alike: a shared word, a longer form, or an alert that named no shop', () => {
    expect(similarDescriptions('AMAZON MKTPLACE PMTS', 'AMAZON MKTPL*AB12CD')).toBe(true);
    expect(similarDescriptions('EXAMPLE BOOKSHOPS', 'BOOKSHOP 42')).toBe(true);
    expect(similarDescriptions('Card Purchase', 'EXAMPLE GARAGE')).toBe(true);
    expect(similarDescriptions('EXAMPLE* SUBSCRIPTION', 'EXAMPLE GARAGE')).toBe(true);
    expect(similarDescriptions('NOODLE BAR', 'GARAGE')).toBe(false);
  });
});

describe('planImport', () => {
  test('alerts already recorded are skipped; new ones are created; repeats in one batch count once', () => {
    const fresh = { date: '2031-03-13', description: 'EXAMPLE GARAGE', amount: 9, card: 'Card One' };
    const plan = planImport([{ ...alert, id: 'al-2' }, fresh, { ...fresh, date: '2031-03-14' }], [statement], 'alert');
    expect(plan.duplicates).toBe(2);
    expect(plan.create).toEqual([fresh]);
  });

  test('a statement row replaces the alert for the same purchase', () => {
    const row = { date: '2031-03-10', description: 'BOOKSHOP #12', amount: 42.42, card: 'Card Three' };
    const plan = planImport([row], [alert], 'statement');
    expect(plan.replace).toEqual([{ id: 'al-1', tx: row }]);
    expect(plan.create).toEqual([]);
  });

  test('statement rows already imported are skipped only on an exact match', () => {
    const same = { date: '2031-03-10', description: 'BOOKSHOP #12', amount: 42.42, card: 'Card Three' };
    const nextDay = { ...same, date: '2031-03-11' };
    const plan = planImport([same, nextDay], [statement], 'statement');
    expect(plan.duplicates).toBe(1);
    expect(plan.create).toEqual([nextDay]);
  });

  test('two identical charges in a file against one already saved adds the second', () => {
    const same = { date: '2031-03-10', description: 'BOOKSHOP #12', amount: 42.42, card: 'Card Three' };
    const plan = planImport([same, same], [statement], 'statement');
    expect(plan.duplicates).toBe(1);
    expect(plan.create).toHaveLength(1);
  });
});

describe('ids', () => {
  test('stableHash is the Apps Script mirror hash', () => {
    // Same function, same answer as apps-script/Firestore.gs (pinned in Firestore.test.ts too).
    expect(stableHash('2031-03-10|EXAMPLE|1.00|Card One')).toBe(stableHash('2031-03-10|EXAMPLE|1.00|Card One'));
    expect(stableHash('a')).not.toBe(stableHash('b'));
  });

  test('statement ids are stable, prefixed and numbered for identical rows', () => {
    const row = { date: '2031-03-10', description: 'EXAMPLE', amount: 1, card: 'Card One' };
    const [a, b] = statementIds([row, row]);
    expect(a).toMatch(/^st-[0-9a-z]+$/);
    expect(b).toBe(`${a}-1`);
    expect(statementIds([row])[0]).toBe(a);
  });

  test('one alert document per email', () => {
    expect(alertId('18f0c0ffee')).toBe('al-18f0c0ffee');
  });
});
