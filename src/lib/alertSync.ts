import { alertQuery, parseAlertEmail, type AlertCard, type ParsedAlert } from './alertEmail';
import type { CategoryRule } from './categorise';
import type { Mailbox } from './mail';
import { alertId, planImport, type Existing } from './matching';

/**
 * One email check: search the member's mail for the household's card alerts, read the ones not seen
 * before, and keep those that aren't already a transaction. Pure apart from the mailbox it is
 * handed, so it runs the same against Gmail, the sample mailbox and test fixtures.
 */

/** At most this many alert emails per check (a month of alerts for a busy household). */
export const MAX_ALERTS = 100;

export interface AlertTx extends ParsedAlert {
  /** The document id (one per email). */
  id: string;
  emailId: string;
}

export interface AlertCheck {
  query: string;
  /** Emails the search found. */
  found: number;
  /** Alerts to write. */
  create: AlertTx[];
  /** Alerts the household already had (from a statement or another member's check). */
  duplicates: number;
  /** Emails that matched the search but weren't a purchase or refund. */
  notPurchases: number;
  /** Message ids read this time, to skip next time. */
  read: string[];
}

export class NothingToSearch extends Error {
  constructor() {
    super('Add the words your card alerts contain (the sender’s address, say) to a card in Settings first.');
    this.name = 'NothingToSearch';
  }
}

export async function checkAlerts(
  mailbox: Mailbox,
  input: { cards: AlertCard[]; labels: string[]; rules: CategoryRule[]; existing: Existing[]; seen?: Set<string> },
): Promise<AlertCheck> {
  const query = alertQuery(input.cards, input.labels);
  if (!query) throw new NothingToSearch();
  const ids = await mailbox.search(query, MAX_ALERTS);
  const have = new Set(input.existing.map((e) => e.id));
  const fresh = ids.filter((id) => !have.has(alertId(id)) && !input.seen?.has(id));
  const parsed: AlertTx[] = [];
  let notPurchases = 0;
  // A few at a time: Gmail answers quickly, but a hundred at once trips its rate limit.
  for (let i = 0; i < fresh.length; i += 10) {
    const messages = await Promise.all(fresh.slice(i, i + 10).map((id) => mailbox.get(id)));
    for (const m of messages) {
      const tx = parseAlertEmail(m, input.cards, input.rules);
      if (!tx) notPurchases++;
      else parsed.push({ ...tx, id: alertId(m.id), emailId: m.id });
    }
  }
  // Oldest first, so of two alerts for one purchase the first one sent is kept.
  parsed.sort((a, b) => a.date.localeCompare(b.date));
  const plan = planImport(parsed, input.existing, 'alert');
  return { query, found: ids.length, create: plan.create, duplicates: plan.duplicates, notPurchases, read: fresh };
}
