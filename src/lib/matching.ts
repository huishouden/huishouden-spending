/**
 * Whether an incoming transaction (a statement file row or a card alert email) is one the household
 * already has. The rules are the Apps Script's (apps-script/Code.gs findExisting): the same card,
 * the same amount, dates at most MATCH_WINDOW_DAYS apart, because an alert carries the email's date
 * and a statement the transaction's date. Added here: the descriptions must look alike, so two
 * different shops charging the same amount in the same week stay two transactions.
 */

export const MATCH_WINDOW_DAYS = 3;

export type Source = 'statement' | 'alert';

export interface TxFields {
  date: string;
  description: string;
  amount: number;
  card: string;
  source?: string;
  /** Which statement file a row came from, when several are imported together. */
  group?: number;
}

export interface Existing extends TxFields {
  id: string;
}

const DAY_MS = 86_400_000;

/** Words that say nothing about which shop it was. */
const FILLER = new Set([
  'the', 'and', 'card', 'purchase', 'payment', 'pos', 'debit', 'credit', 'online', 'www', 'com', 'inc', 'llc', 'ltd', 'co',
  'store', 'shop', 'usa', 'us', 'recurring', 'transaction', 'sale', 'pmts', 'pmt', 'mktplace', 'mktp',
]);

/** The words of a description that identify the merchant: letters only, 3+ long, no filler. */
export function merchantWords(description: string): string[] {
  return description
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !FILLER.has(w));
}

/**
 * Alike when they share a merchant word, or when one has no merchant words at all (an alert that
 * only said "Card purchase"), or when one word starts the other ("AMZN" and "AMAZON" do not, but
 * "BOOKSHOP" and "BOOKSHOPS" do).
 */
export function similarDescriptions(a: string, b: string): boolean {
  const wa = merchantWords(a);
  const wb = merchantWords(b);
  if (wa.length === 0 || wb.length === 0) return true;
  return wa.some((x) => wb.some((y) => x === y || (x.length >= 4 && y.length >= 4 && (x.startsWith(y) || y.startsWith(x)))));
}

const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.005;
const daysApart = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS;
const sameText = (a: string, b: string) => a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ');

/** The script's rule plus alike descriptions: same card and amount, within the window. */
export function sameTransaction(a: TxFields, b: TxFields): boolean {
  return a.card === b.card && sameAmount(a.amount, b.amount) && daysApart(a.date, b.date) <= MATCH_WINDOW_DAYS && similarDescriptions(a.description, b.description);
}

/** Two statement rows are the same only when they agree on everything: a statement's date is exact. */
export function sameStatementRow(a: TxFields, b: TxFields): boolean {
  return a.card === b.card && sameAmount(a.amount, b.amount) && a.date === b.date && sameText(a.description, b.description);
}

export interface Plan<T extends TxFields> {
  /** New transactions to write. */
  create: T[];
  /** Alerts the household already has that this statement row replaces (statements are the record). */
  replace: { id: string; tx: T }[];
  /** How many incoming were already there. */
  duplicates: number;
}

/**
 * What to write for a batch of incoming transactions of one source.
 *
 * - A statement row the household already has from a statement is skipped (each existing row
 *   accounts for one incoming row, so two identical charges in a file against one already saved
 *   adds the second). Rows repeated across files imported together (overlapping exports) count once.
 * - A statement row matching an alert replaces that alert: the statement has the real date and the
 *   bank's name for the shop.
 * - An alert matching anything already there (or earlier in the batch) is skipped.
 */
export function planImport<T extends TxFields>(incoming: T[], existing: Existing[], source: Source): Plan<T> {
  const pool: (TxFields & { id?: string; used?: boolean })[] = existing.map((e) => ({ ...e }));
  const plan: Plan<T> = { create: [], replace: [], duplicates: 0 };
  for (const tx of incoming) {
    if (source === 'statement') {
      // Rows of the same file never match each other; overlapping files do.
      const exact = pool.find((e) => !e.used && e.source !== 'alert' && (e.group === undefined || e.group !== tx.group) && sameStatementRow(e, tx));
      if (exact) {
        exact.used = true;
        plan.duplicates++;
        continue;
      }
      const alert = pool.find((e) => !e.used && e.source === 'alert' && e.id && sameTransaction(e, tx));
      if (alert) {
        alert.used = true;
        plan.replace.push({ id: alert.id!, tx });
        continue;
      }
    } else {
      const match = pool.find((e) => !e.used && sameTransaction(e, tx));
      if (match) {
        match.used = true;
        plan.duplicates++;
        continue;
      }
    }
    plan.create.push(tx);
    // A second email about the same purchase is a duplicate of the first; a second identical row in
    // one statement file is a second purchase, but the same row in another file is the same one.
    pool.push({ ...tx, source, group: source === 'statement' ? (tx.group ?? -1) : undefined });
  }
  return plan;
}

/** cyrb53, as apps-script/Firestore.gs: a stable 53-bit hash in base 36. Not cryptographic. */
export function stableHash(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Document ids for statement rows: stable, so importing the same file twice from two devices at
 * once writes the same documents instead of doubles. Prefixed so they never collide with the ids
 * the Apps Script mirror uses. Identical rows get an occurrence suffix, so give it the whole file
 * (before planning): the second of two identical charges keeps its own id whichever is new.
 */
export function statementIds(rows: TxFields[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const key = [r.date, r.description.trim(), r.amount.toFixed(2), r.card].join('|');
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return `st-${stableHash(key)}${n ? `-${n}` : ''}`;
  });
}

/** An alert's document id: one per email, so checking the same email twice changes nothing. */
export const alertId = (messageId: string) => `al-${messageId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60)}`;
