-- Add is_group_admin() SECURITY DEFINER helper to complement is_group_member().
-- Replace inline EXISTS membership checks in policies with helper calls.
-- Add composite index for feed queries.

-- ---------------------------------------------------------------------------
-- 1. is_group_admin() helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members m
    WHERE m.group_id = p_group_id
      AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin')
  );
$$;
REVOKE ALL ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO service_role;
-- ---------------------------------------------------------------------------
-- 2. Replace inline membership checks with helper function calls
-- ---------------------------------------------------------------------------

-- group_settings: SELECT
DROP POLICY IF EXISTS gs_select_member ON public.group_settings;
CREATE POLICY gs_select_member ON public.group_settings FOR SELECT TO authenticated USING (
  public.is_group_member(group_settings.group_id, auth.uid())
);
-- group_settings: UPDATE (admin/owner only)
DROP POLICY IF EXISTS gs_update_admin ON public.group_settings;
CREATE POLICY gs_update_admin ON public.group_settings FOR UPDATE TO authenticated USING (
  public.is_group_admin(group_settings.group_id, auth.uid())
);
-- group_quests: SELECT
DROP POLICY IF EXISTS gq_select_member ON public.group_quests;
CREATE POLICY gq_select_member ON public.group_quests FOR SELECT TO authenticated USING (
  public.is_group_member(group_quests.group_id, auth.uid())
);
-- group_quests: INSERT
DROP POLICY IF EXISTS gq_insert_member ON public.group_quests;
CREATE POLICY gq_insert_member ON public.group_quests FOR INSERT TO authenticated WITH CHECK (
  creator_id = auth.uid()
  AND public.is_group_member(group_quests.group_id, auth.uid())
);
-- group_quests: UPDATE (creator or admin)
DROP POLICY IF EXISTS gq_update_creator_admin ON public.group_quests;
CREATE POLICY gq_update_creator_admin ON public.group_quests FOR UPDATE TO authenticated USING (
  creator_id = auth.uid()
  OR public.is_group_admin(group_quests.group_id, auth.uid())
);
-- group_challenges: SELECT
DROP POLICY IF EXISTS gc_select_member ON public.group_challenges;
CREATE POLICY gc_select_member ON public.group_challenges FOR SELECT TO authenticated USING (
  public.is_group_member(group_challenges.group_id, auth.uid())
);
-- group_challenges: INSERT
DROP POLICY IF EXISTS gc_insert_member ON public.group_challenges;
CREATE POLICY gc_insert_member ON public.group_challenges FOR INSERT TO authenticated WITH CHECK (
  creator_id = auth.uid()
  AND public.is_group_member(group_challenges.group_id, auth.uid())
);
-- group_challenges: UPDATE (admin only)
DROP POLICY IF EXISTS gc_update_admin ON public.group_challenges;
CREATE POLICY gc_update_admin ON public.group_challenges FOR UPDATE TO authenticated USING (
  public.is_group_admin(group_challenges.group_id, auth.uid())
);
-- group_member_scores: SELECT
DROP POLICY IF EXISTS gms_select_member ON public.group_member_scores;
CREATE POLICY gms_select_member ON public.group_member_scores FOR SELECT TO authenticated USING (
  public.is_group_member(group_member_scores.group_id, auth.uid())
);
-- groups: UPDATE (owner or admin)
DROP POLICY IF EXISTS groups_update_owner_admin ON public.groups;
CREATE POLICY groups_update_owner_admin ON public.groups FOR UPDATE TO authenticated USING (
  owner_id = auth.uid()
  OR public.is_group_admin(groups.id, auth.uid())
) WITH CHECK (
  owner_id = auth.uid()
  OR public.is_group_admin(groups.id, auth.uid())
);
-- completion visibility: use is_group_member for group visibility check
DROP POLICY IF EXISTS completions_select ON public.quest_completions;
CREATE POLICY completions_select ON public.quest_completions FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR (
    status = 'active'
    AND visibility IN ('public', 'friends', 'group')
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE b.blocker_id = auth.uid() AND b.blocked_id = quest_completions.user_id
    )
    AND (
      visibility = 'public'
      OR (
        visibility = 'friends'
        AND (
          EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE (f.user_a_id = auth.uid() AND f.user_b_id = quest_completions.user_id)
               OR (f.user_b_id = auth.uid() AND f.user_a_id = quest_completions.user_id)
          )
          OR quest_completions.user_id = auth.uid()
        )
      )
      OR (
        visibility = 'group'
        AND group_id IS NOT NULL
        AND public.is_group_member(quest_completions.group_id, auth.uid())
      )
    )
  )
);
-- quest_media: use is_group_member for group visibility check
DROP POLICY IF EXISTS quest_media_select ON public.quest_media;
CREATE POLICY quest_media_select ON public.quest_media FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = quest_media.completion_id
      AND (
        c.user_id = auth.uid()
        OR (
          c.status = 'active'
          AND c.visibility IN ('public', 'friends', 'group')
          AND NOT EXISTS (
            SELECT 1 FROM public.blocked_users b
            WHERE b.blocker_id = auth.uid() AND b.blocked_id = c.user_id
          )
          AND (
            c.visibility = 'public'
            OR (
              c.visibility = 'friends'
              AND EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE (f.user_a_id = auth.uid() AND f.user_b_id = c.user_id)
                   OR (f.user_b_id = auth.uid() AND f.user_a_id = c.user_id)
              )
            )
            OR (
              c.visibility = 'group'
              AND c.group_id IS NOT NULL
              AND public.is_group_member(c.group_id, auth.uid())
            )
          )
        )
      )
  )
);
-- ---------------------------------------------------------------------------
-- 3. Composite index for feed queries
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_completions_feed_optimized
ON public.quest_completions (status, quest_source_type, completed_at DESC)
WHERE status = 'active';
-- Drop the old less-specific index that this supersedes
DROP INDEX IF EXISTS idx_completions_source;
