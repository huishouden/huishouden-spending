import { GoogleAuthProvider, reauthenticateWithPopup, type Auth } from 'firebase/auth';
import { extractSpreadsheetId } from '../services/sheets';

/**
 * Reads the legacy Sheet's settings tabs (Cards, Categories, Alert labels) for the one-time move into
 * Spending, with read-only Sheets access the member grants in a popup. A missing tab reads as empty.
 */

const SHEETS_READONLY = 'https://www.googleapis.com/auth/spreadsheets.readonly';

export async function sheetsToken(auth: Auth): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  const provider = new GoogleAuthProvider();
  provider.addScope(SHEETS_READONLY);
  if (user.email) provider.setCustomParameters({ login_hint: user.email });
  const result = await reauthenticateWithPopup(user, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error('Google did not allow reading the Sheet.');
  return token;
}

async function tab(token: string, id: string, range: string): Promise<string[][]> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 400) return [];
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(res.status === 404 ? 'No Sheet at that link, or this account cannot open it.' : `Sheets answered ${res.status}: ${body.error?.message ?? res.statusText}`);
  }
  return ((await res.json()) as { values?: string[][] }).values ?? [];
}

export async function readSheetTabs(token: string, link: string) {
  const id = extractSpreadsheetId(link);
  if (!id) throw new Error('Paste the Sheet’s link first.');
  const [cards, categories, labels] = await Promise.all([tab(token, id, 'Cards!A1:D'), tab(token, id, 'Categories!A1:B'), tab(token, id, "'Alert labels'!A1:A")]);
  return { cards, categories, labels };
}
