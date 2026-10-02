import {
  collection,
  getDocs,
  initializeFirestore,
  limit,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { firebaseApp } from './auth';
import { docsToTransactions, type SpendingDoc } from './spendingDocs';
import type { CardTransaction } from '../types';

/**
 * Spending data mirrored from the Sheet by the Apps Script (apps-script/Firestore.gs):
 *   households/{householdId}/spendingTransactions/{txId}
 * Readable by household members (security rules); never written by the browser.
 */

let db: Firestore | null = null;

function getDb(): Firestore {
  // Offline cache: the dashboard opens with the last data instantly and keeps working offline;
  // onSnapshot then streams changes as the script writes them.
  db ??= initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return db;
}

/** The household whose members include this email, or null when there is none or it is unreadable. */
export async function findHouseholdId(email: string): Promise<string | null> {
  try {
    const snap = await getDocs(
      query(collection(getDb(), 'households'), where('members', 'array-contains', email.toLowerCase()), limit(1)),
    );
    return snap.empty ? null : snap.docs[0].id;
  } catch (err) {
    console.warn('Household lookup failed; falling back to the Sheets source.', err);
    return null;
  }
}

/** Streams the household's transactions; returns the unsubscribe function. */
export function subscribeTransactions(
  householdId: string,
  ignoredKeywords: string[],
  onData: (transactions: CardTransaction[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    collection(getDb(), 'households', householdId, 'spendingTransactions'),
    (snap) => onData(docsToTransactions(snap.docs.map((d) => d.data() as SpendingDoc), ignoredKeywords)),
    onError,
  );
}
