import type { BookEntryStatus, UserShelf } from '../../types/database';
import { STATUS_LABELS } from '../labels';
import { STATUS_SHELF_ORDER } from '../libraryDisplay';
import {
  createShelf,
  fetchLibrary,
  updateEntry,
  updateShelfOrder,
} from '../offline/librarySync';

async function ensureStatusShelf(
  userId: string,
  status: BookEntryStatus,
  shelves: UserShelf[],
): Promise<string> {
  const byFilter = shelves.find((s) => s.status_filter === status);
  if (byFilter) return byFilter.id;

  const label = STATUS_LABELS[status];
  const byName = shelves.find((s) => s.name === label);
  if (byName) return byName.id;

  const shelf = await createShelf(userId, label, status, shelves.length);
  shelves.push(shelf);
  return shelf.id;
}

/** Put every book on the shelf that matches its reading status (prototype layout). */
export async function reorganizeLibraryByStatus(userId: string): Promise<void> {
  const library = await fetchLibrary(userId);
  const shelves = [...library.shelves];
  const shelfByStatus = new Map<BookEntryStatus, string>();

  for (let i = 0; i < STATUS_SHELF_ORDER.length; i++) {
    const status = STATUS_SHELF_ORDER[i];
    const shelfId = await ensureStatusShelf(userId, status, shelves);
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

export { ensureStatusShelf };
