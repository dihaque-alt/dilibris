export interface GoodreadsCsvRow {
  bookId: string;
  title: string;
  author: string;
  additionalAuthors: string;
  isbn: string;
  isbn13: string;
  myRating: number;
  numPages: number | null;
  yearPublished: number | null;
  dateRead: string | null;
  dateAdded: string | null;
  bookshelves: string;
  exclusiveShelf: string;
  myReview: string;
  spoiler: boolean;
  privateNotes: string;
  readCount: number;
  binding: string;
}

const HEADER_ALIASES: Record<string, keyof GoodreadsCsvRow> = {
  'book id': 'bookId',
  title: 'title',
  author: 'author',
  'additional authors': 'additionalAuthors',
  isbn: 'isbn',
  isbn13: 'isbn13',
  'my rating': 'myRating',
  'number of pages': 'numPages',
  'year published': 'yearPublished',
  'date read': 'dateRead',
  'date added': 'dateAdded',
  bookshelves: 'bookshelves',
  'exclusive shelf': 'exclusiveShelf',
  'my review': 'myReview',
  spoiler: 'spoiler',
  'private notes': 'privateNotes',
  'read count': 'readCount',
  binding: 'binding',
};

function parseCsvCells(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || (c === '\r' && next === '\n')) {
      row.push(cell);
      cell = '';
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      if (c === '\r') i++;
    } else if (c !== '\r') {
      cell += c;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((v) => v.trim())) rows.push(row);
  }

  return rows;
}

function parseIntOrNull(value: string): number | null {
  const n = parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseRating(value: string): number {
  const n = parseInt(value.trim(), 10);
  return Number.isFinite(n) && n >= 0 && n <= 5 ? n : 0;
}

function parseBool(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1';
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function rowFromCells(headers: string[], cells: string[]): GoodreadsCsvRow | null {
  const mapped: Partial<Record<keyof GoodreadsCsvRow, string>> = {};

  headers.forEach((header, i) => {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key) mapped[key] = cells[i]?.trim() ?? '';
  });

  const title = mapped.title?.trim();
  if (!title) return null;

  return {
    bookId: mapped.bookId?.trim() ?? '',
    title,
    author: mapped.author?.trim() ?? '',
    additionalAuthors: mapped.additionalAuthors?.trim() ?? '',
    isbn: mapped.isbn?.trim() ?? '',
    isbn13: mapped.isbn13?.trim() ?? '',
    myRating: parseRating(mapped.myRating ?? '0'),
    numPages: parseIntOrNull(mapped.numPages ?? ''),
    yearPublished: parseIntOrNull(mapped.yearPublished ?? ''),
    dateRead: mapped.dateRead?.trim() || null,
    dateAdded: mapped.dateAdded?.trim() || null,
    bookshelves: mapped.bookshelves?.trim() ?? '',
    exclusiveShelf: mapped.exclusiveShelf?.trim() ?? '',
    myReview: mapped.myReview?.trim() ?? '',
    spoiler: parseBool(mapped.spoiler ?? ''),
    privateNotes: mapped.privateNotes?.trim() ?? '',
    readCount: parseIntOrNull(mapped.readCount ?? '') ?? 0,
    binding: mapped.binding?.trim() ?? '',
  };
}

export function parseGoodreadsCsv(text: string): GoodreadsCsvRow[] {
  const table = parseCsvCells(text.replace(/^\uFEFF/, ''));
  if (table.length < 2) return [];

  const headers = table[0];
  const hasBookId = headers.some((h) => normalizeHeader(h) === 'book id');
  if (!hasBookId) {
    throw new Error('Це не схоже на експорт Goodreads — немає колонки «Book Id».');
  }

  const rows: GoodreadsCsvRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const parsed = rowFromCells(headers, table[i]);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

export function parseGoodreadsDate(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().replace(/\//g, '-').split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
