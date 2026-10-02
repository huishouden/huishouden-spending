import type { Firestore } from 'firebase/firestore';
import { initFirestore } from '@huishouden/pwa-kit/firestore';
import { auth, firebaseApp } from './auth';

/**
 * The Firestore connection. The household's spending data itself (households/{householdId}/spending*)
 * is read and written by src/data/useLiveStore.ts.
 */

let db: Firestore | null = null;

export function getDb(): Firestore {
  // Offline cache: the app opens with the last data at once and keeps working offline; onSnapshot
  // then streams changes as members (and the legacy script) write them. Writes come from
  // @huishouden/pwa-kit/firestore, so one made just before the app closes is kept.
  db ??= initFirestore(firebaseApp, { auth });
  return db;
}
