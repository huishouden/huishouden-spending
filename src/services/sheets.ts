import { CardTransaction, ColumnMapping } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetMetaTab {
  id: number;
  title: string;
  rowCount?: number;
}

export interface SpreadsheetDetails {
  id: string;
  title: string;
  sheets: SheetMetaTab[];
}

/**
 * Extract Google Spreadsheet ID from either a full URL or direct ID
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Search user's Google Drive for spreadsheets
 */
export async function listDriveSpreadsheets(
  accessToken: string,
  searchQuery = ''
): Promise<DriveFileItem[]> {
  try {
    let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
    if (searchQuery.trim()) {
      const sanitized = searchQuery.replace(/'/g, "\\'");
      q += ` and name contains '${sanitized}'`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id, name, modifiedTime, webViewLink)');
    url.searchParams.set('pageSize', '50');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const detailedMessage = errJson.error?.message || `Failed to list Drive files (${res.status}): ${res.statusText}`;
      throw new Error(detailedMessage);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: unknown) {
    console.error('listDriveSpreadsheets error:', err);
    throw err;
  }
}

/**
 * Robust CSV parser that handles quoted cells, commas, and newlines
 */
export function parseCSV(text: string): string[][] {
  const p: string[][] = [];
  let row: string[] = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      if (row.length > 1 || row[0] !== '') {
        p.push(row);
      }
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    p.push(row);
  }
  return p;
}

/**
 * Fetch spreadsheet metadata to get title and tab names
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetDetails> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties(sheetId,title,gridProperties.rowCount)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Failed to fetch spreadsheet details: ${res.statusText}`
    );
  }

  const data = await res.json();
  const sheets: SheetMetaTab[] = (data.sheets || []).map((s: { properties?: { sheetId?: number; title?: string; gridProperties?: { rowCount?: number } } }) => ({
    id: s.properties?.sheetId ?? 0,
    title: s.properties?.title || 'Sheet1',
    rowCount: s.properties?.gridProperties?.rowCount,
  }));

  return {
    id: cleanId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
  };
}

/**
 * Universal spreadsheet details fetcher: uses authenticated Google Sheets API
 */
export async function getSpreadsheetDetailsUniversal(
  accessToken: string | null,
  spreadsheetId: string
): Promise<SpreadsheetDetails> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  if (!accessToken) {
    throw new Error(
      'Google authorization token not found or expired. Please tap "Authorize Google Drive & Sheets" to grant secure access to your private spreadsheet.'
    );
  }

  return await getSpreadsheetDetails(accessToken, cleanId);
}

/**
 * Fetch raw values from a spreadsheet tab
 */
export async function getSpreadsheetRows(
  accessToken: string,
  spreadsheetId: string,
  tabTitle: string,
  range = 'A1:Z1000'
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const fullRange = `${tabTitle}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(fullRange)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Google authorization expired (401). Please tap Reconnect to refresh.');
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Failed to read sheet data (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Universal spreadsheet rows fetcher: securely queries the Google Sheets API using the user's OAuth credentials.
 * Ensures the user's spreadsheet and financial data remain 100% private to their Google account.
 */
export async function getSpreadsheetRowsUniversal(
  accessToken: string | null,
  spreadsheetId: string,
  tabTitle: string,
  range = 'A1:Z1000'
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  if (!accessToken) {
    throw new Error(
      'Google authorization token missing or expired. Tap "Reconnect" or "Refresh" to securely renew access to your private spreadsheet.'
    );
  }

  const rows = await getSpreadsheetRows(accessToken, cleanId, tabTitle, range);
  if (!rows || rows.length === 0) {
    throw new Error(`Spreadsheet tab "${tabTitle}" has no rows or is empty.`);
  }

  return rows;
}

/**
 * Auto-detect column mappings from header row
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const norm = headers.map((h) => (h || '').trim().toLowerCase());

  const findCol = (keywords: string[]): string => {
    for (const kw of keywords) {
      const idx = norm.findIndex((col) => col.includes(kw));
      if (idx !== -1) return headers[idx];
    }
    return '';
  };

  return {
    dateCol: findCol(['date', 'posted', 'trans_date', 'transaction date', 'time']) || headers[0] || '',
    merchantCol:
      findCol(['merchant', 'description', 'payee', 'vendor', 'name', 'item']) || headers[1] || '',
    amountCol:
      findCol(['amount', 'cost', 'charge', 'price', 'total', 'debit', 'spent']) || headers[2] || '',
    categoryCol: findCol(['category', 'type', 'tag', 'group', 'genre']) || headers[3] || '',
    cardCol:
      findCol(['card', 'account', 'bank', 'source', 'payment method', 'account name']) ||
      headers[4] ||
      '',
    notesCol: findCol(['notes', 'memo', 'comment', 'detail']),
  };
}

/**
 * Whole-word match, so "rent" skips "RENT PAYMENT" but not "RENTSCHLER" or "RENTALS".
 * Hyphens count as word breaks, so "rent" still matches "RENT-A-CAR"; the default list says
 * "rent payment" for that reason.
 */
export function containsKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(text.toLowerCase());
}

/**
 * Standard list of terms to skip (mortgage, rent, card payment transfers)
 */
export const DEFAULT_IGNORED_PATTERNS = [
  'mortgage',
  'rent payment',
  'lease',
  'property management',
  'payment thank you',
  'autopay',
  'online payment',
  'chase credit crd',
  'robinhood transfer',
  'card payment',
  'direct debit mortgage',
  'escrow',
  'hoa fee',
  'salary',
  'payroll',
];

/**
 * Detect card type and brand from card name / account name
 */
export function inferCardType(cardName: string): {
  type: 'chase' | 'robinhood' | 'other';
  formattedName: string;
} {
  // Issuer only, for styling; the name is kept exactly as the sheet has it.
  const lower = (cardName || '').toLowerCase();
  const formattedName = cardName.trim() || 'Credit Card';
  if (lower.includes('robinhood')) return { type: 'robinhood', formattedName };
  if (lower.includes('chase')) return { type: 'chase', formattedName };
  return { type: 'other', formattedName };
}

/**
 * Parse date strings into standard YYYY-MM-DD
 */
export function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const cleaned = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // MM/DD/YYYY or MM/DD/YY
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const m = slashMatch[1].padStart(2, '0');
    const d = slashMatch[2].padStart(2, '0');
    let y = slashMatch[3];
    if (y.length === 2) {
      y = '20' + y;
    }
    return `${y}-${m}-${d}`;
  }

  // Try standard Date.parse
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parse currency/amount strings. Positive = spend; negative = credit/return, which nets against spend.
 */
export function parseAmount(raw: unknown): number {
  if (typeof raw === 'number') {
    return raw;
  }
  if (!raw) return 0;

  const str = String(raw).replace(/[$,\s]/g, '');
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return parsed;
}

/**
 * Convert sheet rows into CardTransaction list based on column mapping
 */
export function parseSheetRowsToTransactions(
  rows: string[][],
  mapping: ColumnMapping,
  customIgnoredKeywords: string[] = []
): CardTransaction[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h) => (h || '').trim());
  const dateIdx = headers.indexOf(mapping.dateCol);
  const merchantIdx = headers.indexOf(mapping.merchantCol);
  const amountIdx = headers.indexOf(mapping.amountCol);
  const categoryIdx = headers.indexOf(mapping.categoryCol);
  const cardIdx = headers.indexOf(mapping.cardCol);
  const notesIdx = mapping.notesCol ? headers.indexOf(mapping.notesCol) : -1;

  const allIgnored = [...DEFAULT_IGNORED_PATTERNS, ...customIgnoredKeywords].map((k) =>
    k.toLowerCase().trim()
  );

  const transactions: CardTransaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) {
      continue;
    }

    const rawDate = dateIdx >= 0 ? row[dateIdx] : '';
    const rawMerchant = (merchantIdx >= 0 ? row[merchantIdx] : '') || 'Unknown Merchant';
    const rawAmount = amountIdx >= 0 ? row[amountIdx] : 0;
    const rawCategory = (categoryIdx >= 0 ? row[categoryIdx] : '') || 'General Spending';
    const rawCard = (cardIdx >= 0 ? row[cardIdx] : '') || 'Card';
    const rawNotes = notesIdx >= 0 ? row[notesIdx] : '';

    const merchantLower = rawMerchant.toLowerCase();
    const categoryLower = rawCategory.toLowerCase();
    const notesLower = rawNotes.toLowerCase();

    // Check if should be skipped (e.g. mortgage, rent, credit card auto-payments)
    const isIgnored = allIgnored.some(
      (keyword) =>
        keyword &&
        (containsKeyword(merchantLower, keyword) ||
          containsKeyword(categoryLower, keyword) ||
          containsKeyword(notesLower, keyword))
    );

    if (isIgnored) {
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (amount === 0) continue;

    const date = normalizeDate(rawDate);
    const { type: cardType, formattedName } = inferCardType(rawCard);

    transactions.push({
      id: `row-${i}-${date}-${amount}`,
      date,
      merchant: rawMerchant.trim(),
      amount,
      category: cleanCategoryName(rawCategory),
      cardName: formattedName,
      cardType,
      notes: rawNotes.trim(),
    });
  }

  // Sort descending by date
  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

export function cleanCategoryName(cat: string): string {
  const trimmed = (cat || '').trim();
  if (!trimmed) return 'Miscellaneous';

  const lower = trimmed.toLowerCase();
  if (lower.includes('groc') || lower.includes('supermarket') || lower.includes('costco') || lower.includes('trader joe')) {
    return 'Groceries';
  }
  if (lower.includes('dining') || lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('doordash') || lower.includes('uber eats')) {
    return 'Dining & Food';
  }
  if (lower.includes('gas') || lower.includes('fuel') || lower.includes('ev charge') || lower.includes('transit') || lower.includes('parking') || lower.includes('uber') || lower.includes('lyft')) {
    return 'Gas & Transport';
  }
  if (lower.includes('shop') || lower.includes('amazon') || lower.includes('target') || lower.includes('clothing') || lower.includes('electronics')) {
    return 'Shopping & Retail';
  }
  if (lower.includes('sub') || lower.includes('stream') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('apple') || lower.includes('software')) {
    return 'Subscriptions & Tech';
  }
  if (lower.includes('travel') || lower.includes('airline') || lower.includes('flight') || lower.includes('hotel') || lower.includes('airbnb')) {
    return 'Travel & Lodging';
  }
  if (lower.includes('entertain') || lower.includes('movie') || lower.includes('concert') || lower.includes('recreation') || lower.includes('game')) {
    return 'Entertainment';
  }
  if (lower.includes('health') || lower.includes('pharmacy') || lower.includes('doctor') || lower.includes('gym') || lower.includes('fitness') || lower.includes('wellness')) {
    return 'Health & Personal Care';
  }
  if (lower.includes('home') || lower.includes('repair') || lower.includes('hardware') || lower.includes('garden') || lower.includes('home depot')) {
    return 'Home & Garden';
  }

  // Capitalize first letter of words
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}
