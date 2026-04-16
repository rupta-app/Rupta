-- The feed view was running as the owner (postgres), bypassing all RLS on
-- the underlying tables.  With security_invoker the view executes under the
-- calling user's permissions, so the completions_select RLS policy filters
-- out private-group completions for non-members at the query level.

ALTER VIEW public.feed_completions_enriched SET (security_invoker = true);
