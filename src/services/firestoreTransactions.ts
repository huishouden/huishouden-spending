import { findHousehold, saveMyProfile } from '@huishouden/pwa-kit/household';
import type { User } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseApp } from './auth';

/**
 * The Firestore connection and household lookup. The household's spending data itself
 * (households/{householdId}/spending*) is read and written by src/data/useLiveStore.ts.
 */

let db: Firestore | null = null;

export function getDb(): Firestore {
  // Offline cache: the dashboard opens with the last data instantly and keeps working offline;
  // onSnapshot then streams changes as members (and the legacy script) write them.
  db ??= initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return db;
}

/** The household every Huishouden app uses for this person (the kit's shared choice), or null. */
export async function findHouseholdId(email: string): Promise<string | null> {
  try {
    return (await findHousehold(getDb(), email))?.id ?? null;
  } catch (err) {
    console.warn('Household lookup failed; falling back to the Sheets source.', err);
    return null;
  }
}

/** Records this member's name and photo on the household, for the portal and the other apps. */
export function saveProfile(householdId: string, user: User): Promise<void> {
  return saveMyProfile(getDb(), householdId, user);
}
