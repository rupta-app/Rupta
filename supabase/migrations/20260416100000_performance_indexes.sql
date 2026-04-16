-- Performance indexes: add missing FK indexes and composite indexes for hot query patterns.

-- Foreign key columns missing indexes (used in JOINs, RLS subqueries, WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_quest_media_completion
  ON public.quest_media (completion_id);

CREATE INDEX IF NOT EXISTS idx_completion_participants_user
  ON public.completion_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_group_invites_invitee
  ON public.group_invites (invitee_id);

CREATE INDEX IF NOT EXISTS idx_group_invites_inviter
  ON public.group_invites (inviter_id);

CREATE INDEX IF NOT EXISTS idx_group_quests_creator
  ON public.group_quests (creator_id);

CREATE INDEX IF NOT EXISTS idx_challenge_scores_user
  ON public.challenge_scores (user_id);

CREATE INDEX IF NOT EXISTS idx_comments_user
  ON public.comments (user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_user
  ON public.reactions (user_id);

-- Composite index for is_group_member() — called in ~10 RLS policies
CREATE INDEX IF NOT EXISTS idx_group_members_group_user
  ON public.group_members (group_id, user_id);

-- Composite index for validate_and_set_quest_completion trigger (repeatability checks)
CREATE INDEX IF NOT EXISTS idx_completions_user_quest_status
  ON public.quest_completions (user_id, quest_id, status);

-- Composite index for group feed queries and group completion aggregations
CREATE INDEX IF NOT EXISTS idx_completions_group_status_completed
  ON public.quest_completions (group_id, status, completed_at DESC)
  WHERE group_id IS NOT NULL;
