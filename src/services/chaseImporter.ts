import { cardNameFromChaseFileName, type CardsByLast4 } from '../config/cards';
import { parseCSV, normalizeDate, parseAmount, inferCardType, containsKeyword, DEFAULT_IGNORED_PATTERNS } from './sheets';
import { CardTransaction } from './storage';

export interface ChaseParsedResult {
  fileName: string;
  cardName: string;
  totalRows: number;
  validTransactions: CardTransaction[];
  skippedPaymentsCount: number;
  totalSpent: number;
  dateRange: { start: string; end: string };
}

/**
 * Parse a Chase CSV file string into structured transactions
 */
export function parseChaseCSV(
  csvText: string,
  fileName = 'Chase_Activity.csv',
  overrideCardName?: string,
  cards: CardsByLast4 = {}
): ChaseParsedResult {
  const rows = parseCSV(csvText);
  if (!rows || rows.length < 2) {
    throw new Error('CSV file appears to be empty or does not have headers.');
  }

  const headers = rows[0].map((h) => (h || '').trim().toLowerCase());

  // Locate column indices in Chase format:
  // Transaction Date, Post Date, Description, Category, Type, Amount, Memo
  const txDateIdx = headers.findIndex((h) => h.includes('transaction date') || h === 'date' || h === 'posting date');
  const descIdx = headers.findIndex((h) => h.includes('description') || h === 'merchant' || h === 'payee');
  const catIdx = headers.findIndex((h) => h.includes('category'));
  const typeIdx = headers.findIndex((h) => h.includes('type') || h === 'details');
  const amountIdx = headers.findIndex((h) => h.includes('amount'));
  const memoIdx = headers.findIndex((h) => h.includes('memo') || h.includes('note'));

  if (descIdx === -1 || amountIdx === -1) {
    throw new Error('Could not identify Description or Amount columns. Please check if this is a standard Chase CSV.');
  }

  // Detect card name from filename or override
  let cardName = overrideCardName || cardNameFromChaseFileName(fileName, cards) || '';
  // Chase names exports by card digits only; without a Cards list entry the digits are the name.
  if (!cardName) cardName = 'Chase Card';

  const validTransactions: CardTransaction[] = [];
  let skippedPaymentsCount = 0;
  let totalSpent = 0;
  let earliestDate = '9999-99-99';
  let latestDate = '0000-00-00';

  const ignoredKeywords = [
    ...DEFAULT_IGNORED_PATTERNS,
    'payment thank you',
    'automatic payment',
    'autopay',
    'online payment',
  ];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
      continue;
    }

    const rawDate = txDateIdx >= 0 ? row[txDateIdx] : '';
    const rawDesc = (descIdx >= 0 ? row[descIdx] : '') || 'Unknown';
    const rawCategory = (catIdx >= 0 ? row[catIdx] : '') || 'General Spending';
    const rawType = (typeIdx >= 0 ? row[typeIdx] : '') || 'Sale';
    const rawAmountStr = amountIdx >= 0 ? row[amountIdx] : '0';
    const rawMemo = memoIdx >= 0 ? row[memoIdx] : '';

    const descLower = rawDesc.toLowerCase();
    const typeLower = rawType.toLowerCase();

    // Check if it's a payment transfer or return payment
    // "Other" is balance movement such as a loan transfer, not spending.
    const isPayment =
      typeLower.includes('payment') ||
      typeLower === 'other' ||
      ignoredKeywords.some((kw) => containsKeyword(descLower, kw));

    if (isPayment) {
      skippedPaymentsCount++;
      continue;
    }

    // Chase exports sign amounts from the cardholder's side: charges and fees are negative,
    // returns and statement credits (Type "Adjustment") are positive.
    // Flipping the sign gives spend: positive = spent, negative = credited back.
    const num = parseFloat(String(rawAmountStr).replace(/[$,\s]/g, ''));
    if (isNaN(num)) continue;
    const expenseAmount = -num;

    if (expenseAmount === 0) continue;

    const formattedDate = normalizeDate(rawDate);
    if (formattedDate < earliestDate) earliestDate = formattedDate;
    if (formattedDate > latestDate) latestDate = formattedDate;

    totalSpent += expenseAmount;

    // Standardize category
    let cleanCategory = rawCategory.trim();
    if (cleanCategory.toLowerCase() === 'food & drink') cleanCategory = 'Food & Dining';
    if (cleanCategory.toLowerCase() === 'groceries') cleanCategory = 'Groceries';
    if (cleanCategory.toLowerCase() === 'gas') cleanCategory = 'Gas & Fuel';
    if (cleanCategory.toLowerCase() === 'travel') cleanCategory = 'Travel';
    if (cleanCategory.toLowerCase() === 'shopping') cleanCategory = 'Shopping';
    if (!cleanCategory) cleanCategory = 'General Spending';

    const cardInfo = inferCardType(cardName);

    validTransactions.push({
      id: `chase-${formattedDate}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      date: formattedDate,
      merchant: rawDesc.trim(),
      amount: expenseAmount,
      category: cleanCategory,
      cardType: cardInfo.type,
      cardName: cardInfo.formattedName,
      notes: rawMemo || 'Chase Import',
    });
  }

  // Sort descending by date (newest first)
  validTransactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    fileName,
    cardName,
    totalRows: rows.length - 1,
    validTransactions,
    skippedPaymentsCount,
    totalSpent,
    dateRange: {
      start: earliestDate === '9999-99-99' ? '' : earliestDate,
      end: latestDate === '0000-00-00' ? '' : latestDate,
    },
  };
}

/**
 * Format transactions into Tab-Separated Values (TSV)
 * Perfect for 1-click clipboard copy and pasting directly into Google Sheets!
 */
export function formatTransactionsForClipboard(transactions: CardTransaction[]): string {
  // Headers match common Google Sheet spend format:
  // Date \t Merchant \t Category \t Amount \t Card \t Notes
  const rows = transactions.map((t) => {
    return [
      t.date,
      t.merchant.replace(/\t/g, ' '),
      t.category.replace(/\t/g, ' '),
      t.amount.toFixed(2),
      t.cardName.replace(/\t/g, ' '),
      'Chase Import',
    ].join('\t');
  });

  return rows.join('\n');
}

/**
 * Format transactions into a clean downloadable CSV file
 */
export function formatTransactionsToCSV(transactions: CardTransaction[]): string {
  const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Card', 'Notes'];
  const lines = [headers.join(',')];

  for (const t of transactions) {
    const esc = (val: string) => `"${val.replace(/"/g, '""')}"`;
    lines.push([
      esc(t.date),
      esc(t.merchant),
      esc(t.category),
      t.amount.toFixed(2),
      esc(t.cardName),
      esc('Chase Import'),
    ].join(','));
  }

  return lines.join('\n');
}
