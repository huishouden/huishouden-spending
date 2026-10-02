import { cleanCategoryName, parseCSV } from '../services/sheets';
import type { CategoryRule } from './categorise';

/**
 * A one-time move of the settings an Apps Script household kept in its Sheet's tabs into
 * Spending's own settings:
 *
 *   Cards         Last4 | Card | Alert source | Alert keywords ("a|b")  → cards (issuer, alert words)
 *   Categories    Merchant contains | Category                          → category rules
 *   Alert labels  Gmail label                                            → labels the email check searches
 *
 * Rows come from the Sheets API or from rows pasted out of the Sheet (tab- or comma-separated).
 */

export interface SheetCard {
  name: string;
  last4?: string;
  issuer?: string;
  alertWords: string[];
}

export interface SheetSettings {
  cards: SheetCard[];
  rules: CategoryRule[];
  labels: string[];
}

const isHeader = (cell: string | undefined, words: RegExp) => !!cell && words.test(cell.trim());

/** Rows pasted from a Sheet: tabs when copied from Sheets, commas when copied from a CSV. */
export function pastedRows(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.some((l) => l.includes('\t'))) return lines.map((l) => l.split('\t').map((c) => c.trim()));
  return parseCSV(lines.join('\n')).map((r) => r.map((c) => c.trim()));
}

export function cardsFromSheetRows(rows: string[][]): SheetCard[] {
  const out: SheetCard[] = [];
  for (const [i, row] of rows.entries()) {
    const [last4Raw = '', name = '', source = '', keywords = ''] = row;
    if (i === 0 && isHeader(last4Raw, /last ?4|digits/i)) continue;
    if (!name.trim()) continue;
    const digits = last4Raw.trim() ? last4Raw.trim().padStart(4, '0') : '';
    out.push({
      name: name.trim(),
      ...(/^\d{4}$/.test(digits) ? { last4: digits } : {}),
      ...(source.trim() ? { issuer: source.trim() } : {}),
      alertWords: keywords.split('|').map((w) => w.trim()).filter(Boolean),
    });
  }
  return out;
}

export function rulesFromSheetRows(rows: string[][]): CategoryRule[] {
  const out: CategoryRule[] = [];
  for (const [i, [contains = '', category = '']] of rows.entries()) {
    if (i === 0 && isHeader(contains, /merchant|contains/i)) continue;
    if (contains.trim() && category.trim()) out.push({ contains: contains.trim().toLowerCase(), category: cleanCategoryName(category) });
  }
  return out;
}

export function labelsFromSheetRows(rows: string[][]): string[] {
  return rows
    .map(([l = ''], i) => (i === 0 && isHeader(l, /^(alert )?labels?$/i) ? '' : l.trim()))
    .filter(Boolean);
}

export function fromSheetTabs(tabs: { cards?: string[][]; categories?: string[][]; labels?: string[][] }): SheetSettings {
  return {
    cards: cardsFromSheetRows(tabs.cards ?? []),
    rules: rulesFromSheetRows(tabs.categories ?? []),
    labels: labelsFromSheetRows(tabs.labels ?? []),
  };
}
