import { cleanCategoryName, containsKeyword, DEFAULT_IGNORED_PATTERNS, inferCardType, normalizeDate } from './sheets';
import type { CardTransaction } from '../types';

export interface SpendingDoc {
  /** The document id, when the caller has it; transactions keep it so they can be edited. */
  id?: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  card: string;
  type: string;
  source?: string;
}

/**
 * Documents to the dashboard's transactions, by the same rules the Sheet rows go through
 * (parseSheetRowsToTransactions): skipped words, categories in the dashboard's words, newest first.
 */
export function docsToTransactions(docs: SpendingDoc[], ignoredKeywords: string[]): CardTransaction[] {
  const ignored = [...DEFAULT_IGNORED_PATTERNS, ...ignoredKeywords].map((k) => k.toLowerCase().trim()).filter(Boolean);
  const out: CardTransaction[] = [];
  docs.forEach((d, i) => {
    const merchant = (d.description || 'Unknown Merchant').trim();
    const category = d.category || 'General Spending';
    if (ignored.some((k) => containsKeyword(merchant, k) || containsKeyword(category, k))) return;
    const amount = typeof d.amount === 'number' ? d.amount : Number(d.amount) || 0;
    if (amount === 0) return;
    const { type, formattedName } = inferCardType(d.card || 'Card');
    out.push({
      id: d.id ?? `doc-${i}`,
      date: normalizeDate(d.date),
      merchant,
      amount,
      category: cleanCategoryName(category),
      cardName: formattedName,
      cardType: type,
      notes: '',
    });
  });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
