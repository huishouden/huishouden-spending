import { expect, test } from 'bun:test';
import docs from './__fixtures__/spending-docs.json';
import { docsToTransactions } from './spendingDocs';

test('Firestore documents parse exactly like Sheet rows', () => {
  const txs = docsToTransactions(docs, ['rent payment']);
  expect(txs.map((t) => [t.date, t.merchant, t.amount, t.cardName])).toEqual([
    ['2031-03-11', 'EXAMPLE BOOKSHOP', 27.1, 'Card Two'],
    ['2031-03-08', 'EXAMPLE OUTFITTERS', -18, 'Card One'],
  ]);
});
