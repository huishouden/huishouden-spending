import { categorise, type CategoryRule } from './categorise';
import { htmlToText } from './html';
import type { MailMessage } from './mail';

/**
 * Card purchase alert emails to transactions. The patterns are apps-script/Code.gs's
 * parseTransactionEmail with every bank name taken out: which emails are card alerts, and which card
 * each is for, comes from the household's cards (their last four digits and alert words).
 */

export interface AlertCard {
  name: string;
  last4?: string;
  /** Sender addresses or words that appear in this card's alert emails. */
  alertWords: string[];
}

export interface ParsedAlert {
  date: string;
  description: string;
  amount: number;
  category: string;
  card: string;
  type: 'Sale' | 'Return';
  last4?: string;
}

/** How far back a check looks, as the Apps Script did: a missed week loses nothing. */
export const ALERT_LOOKBACK_DAYS = 30;

const unsafe = (s: string) => s.replace(/["(){}]/g, ' ').replace(/\s+/g, ' ').trim();
const looksLikeSender = (w: string) => /@/.test(w) || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(w);

/** Gmail's search form of a label name: lowercase, spaces and slashes as dashes. */
export const labelToken = (label: string) => unsafe(label).toLowerCase().replace(/[\s/]+/g, '-');

/**
 * The Gmail search for the household's card alerts: any card's alert words (an address or domain
 * searches the sender, anything else is a phrase), or any of the household's alert labels.
 * Null when there is nothing to search for.
 */
export function alertQuery(cards: AlertCard[], labels: string[] = [], days = ALERT_LOOKBACK_DAYS): string | null {
  const terms = new Set<string>();
  for (const c of cards) {
    for (const raw of c.alertWords) {
      const w = unsafe(raw);
      if (!w) continue;
      terms.add(looksLikeSender(w) ? `from:(${w.toLowerCase()})` : `"${w}"`);
    }
  }
  for (const l of labels) if (unsafe(l)) terms.add(`label:${labelToken(l)}`);
  if (terms.size === 0) return null;
  return `newer_than:${days}d (${[...terms].join(' OR ')})`;
}

function wordPattern(words: string[]): RegExp {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
}

/**
 * The card an alert is for: its last four digits when the email quotes them and the household has
 * that card; otherwise a word only one card lists (a product name, a sender only that card uses);
 * otherwise the digits as they are, never a guess.
 */
export function identifyCard(text: string, cards: AlertCard[]): { card: string; last4?: string } {
  const m = text.match(/(?:ending|ends)\s+in\s+(\d{4})|\(\.{2,3}\s?(\d{4})\)|x{2,}(\d{4})|\bon card\s+(\d{4})/i);
  const digits = m ? m[1] || m[2] || m[3] || m[4] : undefined;
  const byDigits = digits ? cards.find((c) => c.last4 === digits) : undefined;
  if (byDigits) return { card: byDigits.name, last4: digits };
  const count = new Map<string, number>();
  for (const c of cards) for (const w of new Set(c.alertWords.map((x) => x.trim().toLowerCase()).filter(Boolean))) count.set(w, (count.get(w) ?? 0) + 1);
  for (const c of cards) {
    const own = c.alertWords.map((x) => x.trim()).filter((w) => w && count.get(w.toLowerCase()) === 1);
    if (own.length && wordPattern(own).test(text)) return { card: c.name, ...(digits ? { last4: digits } : {}) };
  }
  return digits ? { card: `Card ...${digits}`, last4: digits } : { card: 'Unknown Card' };
}

export function cleanMerchantName(raw: string): string {
  let s = String(raw || '').trim().replace(/<[^>]*>/g, '').replace(/^(?:at|with|purchase at|charged at)\s+/i, '');
  s = s.replace(/\s+(?:on\s+[A-Za-z]+|on\s+\d{1,2}\/|with your card|with card|\.|\$|\().*$/i, '');
  return s.trim() || 'Card Purchase';
}

/** The merchant, by the wordings card alerts use (labelled fields, table cells, sentences). */
export function extractMerchant(subject: string, body: string, html: string): string {
  const text = `${subject}\n${body}`;
  const isLabel = (s: string) => /Amount|Date|Account|\$|Card ending/i.test(s);

  const labelled = text.match(/(?:Merchant|Payee|Where|Vendor|Store)\s*[:\n\r]+\s*([^\r\n<]+)/i);
  if (labelled && labelled[1].trim() && !isLabel(labelled[1])) return cleanMerchantName(labelled[1]);

  const cell = html.match(/(?:Merchant|Payee|Store|Vendor)[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
  if (cell && cell[1].trim() && !isLabel(cell[1])) return cleanMerchantName(cell[1]);

  // "77.77 USD at MERCHANT in LOCATION on Card 1234" or "used at MERCHANT in LOCATION, USA for 77.77 USD".
  const located = text.match(/USD at (.+?) in [^\n]+? on Card \d{4}/i) || text.match(/\bat (.+?) in [^\n]+?, [A-Z]{2,3} for [0-9.,]+ USD/);
  if (located && located[1].trim()) return cleanMerchantName(located[1]);

  // "a refund of $18.00 from MERCHANT", "You have a $18.00 refund from MERCHANT".
  const refundFrom = text.match(/(?:refund|credit)(?:\s+of\s+\$[0-9.,]+)?\s+from\s+([^\r\n<]+?)(?:\s+(?:was|on|to)\b|\.\s|\n|<|$)/i);
  if (refundFrom && refundFrom[1].trim() && !isLabel(refundFrom[1])) return cleanMerchantName(refundFrom[1]);

  // "You made a $27.10 transaction with MERCHANT".
  const withMerchant = text.match(/transaction\s+with\s+([^\r\n<]+?)(?:\s+(?:on\b|using\b|was\b)|\.\s|\n|<|$)/i);
  if (withMerchant && withMerchant[1].trim() && !isLabel(withMerchant[1])) return cleanMerchantName(withMerchant[1]);

  // "You spent $12.00 at MERCHANT", "A purchase of $12.50 at MERCHANT was made".
  const at = text.match(/(?:purchase|transaction|charge|spent|used for).*?\bat\s+([A-Za-z0-9 &.,'’\-*#]+?)(?:\s+(?:on|with|using|for|was|has|is)\b|\.|\n|<|\$|\d{1,2}\/\d{1,2})/i);
  if (at && at[1].trim() && !/\b(?:visa|mastercard|card)\b/i.test(at[1])) return cleanMerchantName(at[1]);

  const subj = subject.match(/\bat\s+([A-Za-z0-9 &.,'’\-*#]+?)(?:\s+(?:on\b|with\b)|\.|\$|$)/i);
  if (subj && subj[1].trim()) return cleanMerchantName(subj[1]);

  return 'Card Purchase';
}

const localYmd = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** One alert email as a transaction, or null when it isn't a purchase or refund (a payment notice, say). */
export function parseAlertEmail(msg: MailMessage, cards: AlertCard[], rules: CategoryRule[]): ParsedAlert | null {
  const html = msg.html ?? '';
  const body = msg.text ?? (html ? htmlToText(html) : '');
  const text = `${msg.subject}\n${body}`;

  if (/payment thank you|autopay|automatic payment|payment received|we received your payment|thank you for your payment/i.test(text)) return null;

  const amountMatch = text.match(/\$\s?([0-9,]+\.[0-9]{2})/) || text.match(/([0-9,]+\.[0-9]{2})\s*USD/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  if (!amount || Number.isNaN(amount)) return null;

  const description = extractMerchant(msg.subject, body, html);
  // Only the alert's wording marks a refund.
  const isRefund = /\brefund|\bcredit (?:of|for|to)|\breturn(?:ed)?\b|merchant credit/i.test(text);
  const { card, last4 } = identifyCard(`${msg.from}\n${text}`, cards);
  return {
    date: localYmd(msg.date),
    description,
    amount: isRefund ? -amount : amount,
    category: categorise(description, rules),
    card,
    type: isRefund ? 'Return' : 'Sale',
    ...(last4 ? { last4 } : {}),
  };
}
