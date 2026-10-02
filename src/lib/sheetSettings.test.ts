import { expect, test } from 'bun:test';
import { fromSheetTabs, pastedRows } from './sheetSettings';

// Rows as the legacy Sheet's tabs hold them (invented values).
test('the Cards, Categories and Alert labels tabs become cards, rules and labels', () => {
  const got = fromSheetTabs({
    cards: [
      ['Last4', 'Card', 'Alert source', 'Alert keywords'],
      ['1111', 'Card One', 'Example Bank', ''],
      ['222', 'Card Two', '', 'travel rewards|blue'],
      ['', 'Card Three'],
      ['4444', ''],
    ],
    categories: [
      ['Merchant contains', 'Category'],
      ['Example Cafe', 'Food & Drink'],
      ['example vet', 'Pets'],
      ['', 'Groceries'],
    ],
    labels: [['Alert labels'], ['Bank/Transactions'], ['']],
  });
  expect(got).toEqual({
    cards: [
      { name: 'Card One', last4: '1111', issuer: 'Example Bank', alertWords: [] },
      { name: 'Card Two', last4: '0222', alertWords: ['travel rewards', 'blue'] },
      { name: 'Card Three', alertWords: [] },
    ],
    rules: [
      { contains: 'example cafe', category: 'Dining & Food' },
      { contains: 'example vet', category: 'Pets' },
    ],
    labels: ['Bank/Transactions'],
  });
});

test('pasted rows: tabs from Sheets, commas from a CSV', () => {
  expect(pastedRows('1111\tCard One\n\n2222\tCard Two\n')).toEqual([['1111', 'Card One'], ['2222', 'Card Two']]);
  expect(pastedRows('example cafe,"Food & Drink"\r\n')).toEqual([['example cafe', 'Food & Drink']]);
});
