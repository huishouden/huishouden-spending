// Card display names come from the spreadsheet's "Cards" tab (Last4 | Card | Alert source), the same
// list the Apps Script alert sync reads, so every writer names a card the same way and no card
// details live in this repo.
export type CardsByLast4 = Record<string, string>;

export async function loadCardsFromSheet(accessToken: string, spreadsheetId: string): Promise<CardsByLast4> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Cards!A2:B`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return {};
  const data: { values?: string[][] } = await res.json();
  return cardsFromRows(data.values ?? []);
}

export function cardsFromRows(rows: string[][]): CardsByLast4 {
  const cards: CardsByLast4 = {};
  for (const [last4, name] of rows) {
    const digits = String(last4 ?? '').trim().padStart(4, '0');
    if (/^\d{4}$/.test(digits) && name?.trim()) cards[digits] = name.trim();
  }
  return cards;
}

/** Card name for a Chase export, whose file name is "Chase<last4>_Activity_<date>.csv". */
export function cardNameFromChaseFileName(fileName: string, cards: CardsByLast4): string | null {
  const last4 = fileName.match(/chase(\d{4})/i)?.[1] ?? fileName.match(/(\d{4})/)?.[1];
  if (!last4) return null;
  return cards[last4] ?? `Chase (...${last4})`;
}
