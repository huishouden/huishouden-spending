import type { Mailbox as GmailMailbox } from '@huishouden/pwa-kit/gmail';

/** One email as a mailbox returns it: the kit's read-only Gmail shape, shared with Huishouden Bills. */
export type { MailMessage } from '@huishouden/pwa-kit/gmail';

/** Read-only access to a member's mail: Gmail in the app, a stand-in in the sample and in tests. Spending needs only search and get. */
export type Mailbox = Pick<GmailMailbox, 'search' | 'get'>;
