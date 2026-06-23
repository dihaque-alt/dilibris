-- Audiobook format + percent-based progress (for books without pages).

alter type public.reading_format add value if not exists 'audiobook';

alter table public.user_book_entries
  add column if not exists progress_mode text not null default 'pages'
  check (progress_mode in ('pages', 'percent'));

comment on column public.user_book_entries.progress_mode is
  'pages: current_page / total_pages; percent: current_page holds 0–100.';
