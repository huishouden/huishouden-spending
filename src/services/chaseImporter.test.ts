import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { parseChaseCSV } from './chaseImporter';

const fileName = 'Chase1111_Activity_20310321.csv';
const csv = readFileSync(new URL(`./__fixtures__/${fileName}`, import.meta.url), 'utf8');
const result = parseChaseCSV(csv, fileName, undefined, { '1111': 'Card One' }); // made-up digits
const amounts = Object.fromEntries(result.validTransactions.map((t) => [t.merchant, t.amount]));

test('card name comes from the Cards list by the last four digits in the file name', () => {
  expect(result.cardName).toBe('Card One');
});

test('charges and fees are positive spend; returns and statement credits are negative', () => {
  expect(amounts['COFFEE SHOP 123']).toBe(12.5);
  expect(amounts['ANNUAL MEMBERSHIP FEE']).toBe(120);
  expect(amounts['EXAMPLE OUTFITTERS']).toBe(-18);
  expect(amounts['STATEMENT CREDIT']).toBe(-35);
});

test('card payments, loan transfers and rent payments are skipped', () => {
  expect(amounts['Payment Thank You-Mobile']).toBeUndefined();
  expect(amounts['LOAN TRANSFER TO 0000']).toBeUndefined();
  expect(amounts['LANDLORD RENT PAYMENT']).toBeUndefined();
  expect(result.skippedPaymentsCount).toBe(3);
});

test('ignore keywords match whole words, not substrings', () => {
  expect(amounts['RENTSCHLER BAKERY']).toBe(14.2);
  expect(amounts['ACME RENT-A-CAR']).toBe(41.5);
});
