import type { BookEntryStatus, UserBookEntry, UserShelf } from '../types/database';

/** Prototype shelf order: active reading first, then queues. */
export const STATUS_SHELF_ORDER: BookEntryStatus[] = [
  'reading',
  'want_to_read',
  'finished',
  're_reading',
  'dnf',
];

export function shelfBookCount(shelfId: string, entries: UserBookEntry[]): number {
  return entries.filter((e) => e.shelf_id === shelfId).length;
}

export function sortShelvesForDisplay(
  shelves: UserShelf[],
  _entries: UserBookEntry[],
): UserShelf[] {
  return [...shelves].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name, 'uk');
  });
}

/** Hide empty custom shelves when the library already has books elsewhere. */
export function shelvesForLibraryView(
  shelves: UserShelf[],
  entries: UserBookEntry[],
  filterActive: boolean,
): UserShelf[] {
  const sorted = sortShelvesForDisplay(shelves, entries);
  if (filterActive || entries.length <= 8) return sorted;

  return sorted.filter((shelf) => {
    const n = shelfBookCount(shelf.id, entries);
    if (n > 0) return true;
    return shelf.status_filter != null;
  });
}
