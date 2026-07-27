export type BookEntryStatus =
  | 'want_to_read'
  | 'reading'
  | 'finished'
  | 'dnf'
  | 're_reading';

export type ReadingFormat = 'paper' | 'ebook' | 'audiobook';
export type ProgressMode = 'pages' | 'percent';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  locale: string;
  is_profile_public: boolean;
  onboarded_at: string | null;
  app_prefs?: Record<string, unknown>;
}

export interface UserShelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  status_filter: BookEntryStatus | null;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  cover_url: string | null;
  page_count: number | null;
  published_year: number | null;
  language: string | null;
  external_ids: Record<string, string>;
}

export interface UserBookEntry {
  id: string;
  user_id: string;
  book_id: string;
  shelf_id: string | null;
  status: BookEntryStatus;
  format: ReadingFormat | null;
  progress_mode?: ProgressMode;
  rating: number | null;
  current_page: number;
  total_pages: number | null;
  total_minutes: number;
  started_on: string | null;
  finished_on: string | null;
  counts_toward_stats: boolean;
  parent_entry_id?: string | null;
  updated_at?: string;
  book?: Book;
}

export interface ReadingSession {
  id: string;
  entry_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  pages_read: number;
  minutes: number;
  note: string | null;
  created_at: string;
}

/** In-progress reading timer; one row per user until saved or discarded. */
export interface ActiveReadingSession {
  user_id: string;
  entry_id: string;
  accumulated_seconds: number;
  is_running: boolean;
  last_tick_at: string;
  pages_draft: string;
  note_draft: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  entry_id: string | null;
  body: string;
  rating: number;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, 'display_name' | 'avatar_url'>;
}

export type NoteType = 'quote' | 'thought' | 'general';
export type NoteVisibility = 'private' | 'public';

export interface Note {
  id: string;
  user_id: string;
  entry_id: string;
  book_id: string;
  buddy_read_id: string | null;
  note_type: NoteType;
  visibility: NoteVisibility;
  body: string;
  page_number: number | null;
  chapter: string | null;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, 'display_name' | 'avatar_url'>;
}

export interface ReadingChallenge {
  id: string;
  user_id: string;
  title: string;
  year: number;
  target_books: number;
  target_pages: number;
  target_minutes: number;
  starts_on: string | null;
  ends_on: string | null;
}

export type BuddyReadMemberRole = 'owner' | 'member';

export interface BuddyRead {
  id: string;
  owner_id: string;
  book_id: string;
  title: string;
  description: string | null;
  invite_token: string;
  target_finish_on: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  book?: Pick<Book, 'id' | 'title' | 'authors' | 'cover_url'>;
}

export interface BuddyReadMember {
  id: string;
  buddy_read_id: string;
  user_id: string;
  role: BuddyReadMemberRole;
  joined_at: string;
  profile?: Pick<Profile, 'display_name' | 'avatar_url'>;
}

export interface BuddyReadMessage {
  id: string;
  buddy_read_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Pick<Profile, 'display_name'>;
}

export interface BuddyReadListItem {
  role: BuddyReadMemberRole;
  buddy_read: BuddyRead;
}

export interface OpenLibraryHit {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  language?: string[];
  isbn?: string[];
}
