-- Returns comments for a completion ordered by like count (desc), then newest first.
-- Supports cursor-based pagination via p_limit / p_offset.
create or replace function fetch_comments_ranked(
  p_completion_id uuid,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  completion_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  like_count bigint
)
language sql stable
as $$
  select
    c.id,
    c.completion_id,
    c.user_id,
    c.content,
    c.created_at,
    coalesce(cr.cnt, 0) as like_count
  from comments c
  left join lateral (
    select count(*) as cnt
    from comment_reactions r
    where r.comment_id = c.id
  ) cr on true
  where c.completion_id = p_completion_id
  order by like_count desc, c.created_at desc
  limit p_limit
  offset p_offset;
$$;
