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

/** Two alerts for the sample household's cards and one payment notice, all in March 2031. */
export const alerts = [
  alertMessage('msg-grocery', '2031-03-14T09:00:00', 'Example Bank <alerts@bank.example.com>', 'Purchase alert', 'You spent $61.15 at EXAMPLE GROCERY with your card ending in 1111.'),
  alertMessage('msg-noodle', '2031-03-13T19:30:00', 'Example Card Co <notices@card.example.com>', 'You made a $23.40 transaction', 'You made a $23.40 transaction with EXAMPLE NOODLE BAR on your card ending in 2222.'),
  alertMessage('msg-payment', '2031-03-12T08:00:00', 'Example Bank <alerts@bank.example.com>', 'Payment received', 'We received your payment of $500.00. Thank you for your payment.'),
];
