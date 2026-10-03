import type { Firestore } from 'firebase/firestore';
import { firebase } from './auth';

/**
 * The Firestore connection, opened on first use with the kit's offline cache and write outbox. The
 * household's spending data itself (households/{householdId}/spending*) is read and written by
 * src/data/useLiveStore.ts.
 */
export const getDb = (): Firestore => firebase.db;
