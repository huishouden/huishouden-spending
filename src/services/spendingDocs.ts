import { parseSheetRowsToTransactions } from './sheets';
import type { CardTransaction, ColumnMapping } from '../types';

export interface SpendingDoc {
  date: string;
  description: string;
  amount: number;
  category: string;
  card: string;
  type: string;
  source?: string;
}

const MAPPING: ColumnMapping = {
  dateCol: 'Date',
  merchantCol: 'Description',
  amountCol: 'Amount',
  categoryCol: 'Category',
  cardCol: 'Card',
};

/**
 * Documents back into Sheet-shaped rows, so both sources go through the same parser and the same
 * ignore-keyword filtering and produce identical transactions.
 */
export function docsToTransactions(docs: SpendingDoc[], ignoredKeywords: string[]): CardTransaction[] {
  const rows = [
    ['Date', 'Description', 'Amount', 'Category', 'Card', 'Type'],
    ...docs.map((d) => [d.date, d.description, String(d.amount), d.category, d.card, d.type]),
  ];
  return parseSheetRowsToTransactions(rows, MAPPING, ignoredKeywords);
}
