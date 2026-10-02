/** One email as a mailbox returns it (the same shape Huishouden Bills uses). */
export interface MailMessage {
  id: string;
  /** ms since epoch. */
  date: number;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/** Read-only access to a member's mail: Gmail in the app, a stand-in in the sample and in tests. */
export interface Mailbox {
  /** Message ids matching a Gmail search, newest first. */
  search(query: string, max: number): Promise<string[]>;
  /** One message with its text and HTML parts. */
  get(id: string): Promise<MailMessage>;
}
