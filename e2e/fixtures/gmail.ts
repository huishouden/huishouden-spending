// Gmail API answers for invented card alerts (users.messages.get, format=full).

const b64url = (text: string) => Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function alertMessage(id: string, sentAt: string, from: string, subject: string, text: string) {
  return {
    id,
    threadId: `t-${id}`,
    internalDate: String(Date.parse(sentAt)),
    payload: {
      mimeType: 'multipart/alternative',
      headers: [
        { name: 'From', value: from },
        { name: 'Subject', value: subject },
      ],
      parts: [{ mimeType: 'text/plain', body: { data: b64url(text) } }],
    },
  };
}

/** Two alerts for the sample household's cards and one payment notice, the day before the sample household's clock starts (27 September 2026). */
export const alerts = [
  alertMessage('msg-grocery', '2026-09-26T09:00:00', 'Example Bank <alerts@bank.example.com>', 'Purchase alert', 'You spent $61.15 at EXAMPLE GROCERY with your card ending in 1111.'),
  alertMessage('msg-noodle', '2026-09-25T19:30:00', 'Example Card Co <notices@card.example.com>', 'You made a $23.40 transaction', 'You made a $23.40 transaction with EXAMPLE NOODLE BAR on your card ending in 2222.'),
  alertMessage('msg-payment', '2026-09-24T08:00:00', 'Example Bank <alerts@bank.example.com>', 'Payment received', 'We received your payment of $500.00. Thank you for your payment.'),
];
