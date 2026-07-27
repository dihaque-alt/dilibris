import type { BookEntryStatus } from '../../types/database';
import { STATUS_SHELF_ORDER } from '../libraryDisplay';
import {
  ensureStatusShelfForUser,
  fetchLibrary,
  updateEntry,
  updateShelfOrder,
} from '../offline/librarySync';

/** Put every book on the shelf that matches its reading status (prototype layout). */
export async function reorganizeLibraryByStatus(userId: string): Promise<void> {
  const library = await fetchLibrary(userId);
  const shelfByStatus = new Map<BookEntryStatus, string>();

  for (let i = 0; i < STATUS_SHELF_ORDER.length; i++) {
    const status = STATUS_SHELF_ORDER[i];
    const shelfId = await ensureStatusShelfForUser(userId, status);
    shelfByStatus.set(status, shelfId);
    await updateShelfOrder(userId, shelfId, i);
  }

  for (const entry of library.entries) {
    const targetShelfId = shelfByStatus.get(entry.status);
    if (targetShelfId && entry.shelf_id !== targetShelfId) {
      await updateEntry(userId, entry.id, { shelf_id: targetShelfId });
    }
  }

  await fetchLibrary(userId);
}

export { ensureStatusShelfForUser as ensureStatusShelf };
