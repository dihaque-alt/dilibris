-- Aggregate reading stats for public profiles (anon-safe via security definer)

create or replace function public.get_public_profile_stats(p_user_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not exists (
      select 1
      from public.profiles p
      where p.id = p_user_id
        and (p.is_profile_public = true or p.id = auth.uid())
    ) then null::json
    else (
      select json_build_object(
        'books_finished', count(*) filter (
          where e.status = 'finished'
            and e.counts_toward_stats
        ),
        'books_finished_year', count(*) filter (
          where e.status = 'finished'
            and e.counts_toward_stats
            and e.finished_on >= date_trunc('year', current_date)::date
        ),
        'pages_read_year', coalesce(sum(e.total_pages) filter (
          where e.status = 'finished'
            and e.counts_toward_stats
            and e.finished_on >= date_trunc('year', current_date)::date
        ), 0),
        'minutes_read_year', coalesce(sum(e.total_minutes) filter (
          where e.status = 'finished'
            and e.counts_toward_stats
            and e.finished_on >= date_trunc('year', current_date)::date
        ), 0),
        'avg_rating_year', (
          select round(avg(e2.rating)::numeric, 1)
          from public.user_book_entries e2
          where e2.user_id = p_user_id
            and e2.status = 'finished'
            and e2.counts_toward_stats
            and e2.finished_on >= date_trunc('year', current_date)::date
            and e2.rating is not null
        ),
        'currently_reading', count(*) filter (where e.status = 'reading')
      )
      from public.user_book_entries e
      where e.user_id = p_user_id
    )
  end;
$$;

comment on function public.get_public_profile_stats(uuid) is
  'Public profile stats for users with is_profile_public = true; returns null otherwise.';

grant execute on function public.get_public_profile_stats(uuid) to anon, authenticated;
