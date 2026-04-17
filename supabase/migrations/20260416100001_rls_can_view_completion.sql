-- Consolidate repeated completion-visibility logic into a single SECURITY DEFINER
-- helper. This avoids recursive RLS checks on blocked_users, friendships, and
-- group_members inside per-row policy evaluation.

-- ---------------------------------------------------------------------------
-- 1. can_view_completion() helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_view_completion(
  p_viewer_id uuid,
  p_owner_id uuid,
  p_status text,
  p_visibility text,
  p_quest_source_type text,
  p_group_id uuid
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT
    p_owner_id = p_viewer_id
    OR (
      p_status = 'active'
      -- Not blocked
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users b
        WHERE b.blocker_id = p_viewer_id AND b.blocked_id = p_owner_id
      )
      -- Private group gate
      AND (
        p_quest_source_type <> 'group'
        OR p_group_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.group_settings s
          WHERE s.group_id = p_group_id AND s.is_public = TRUE
        )
        OR public.is_group_member(p_group_id, p_viewer_id)
      )
      -- Visibility gate
      AND (
        p_visibility = 'public'
        OR (
          p_visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE (f.user_a_id = p_viewer_id AND f.user_b_id = p_owner_id)
               OR (f.user_b_id = p_viewer_id AND f.user_a_id = p_owner_id)
          )
        )
        OR (
          p_visibility = 'group'
          AND p_group_id IS NOT NULL
          AND public.is_group_member(p_group_id, p_viewer_id)
        )
      )
    );
$$;
REVOKE ALL ON FUNCTION public.can_view_completion(uuid, uuid, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_completion(uuid, uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_completion(uuid, uuid, text, text, text, uuid) TO service_role;
-- ---------------------------------------------------------------------------
-- 2. Simplify completions_select policy
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS completions_select ON public.quest_completions;
CREATE POLICY completions_select ON public.quest_completions FOR SELECT TO authenticated USING (
  public.can_view_completion(
    auth.uid(),
    user_id,
    status,
    visibility,
    quest_source_type,
    group_id
  )
);
-- ---------------------------------------------------------------------------
-- 3. Simplify quest_media_select policy
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS quest_media_select ON public.quest_media;
CREATE POLICY quest_media_select ON public.quest_media FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = quest_media.completion_id
      AND public.can_view_completion(
        auth.uid(),
        c.user_id,
        c.status,
        c.visibility,
        c.quest_source_type,
        c.group_id
      )
  )
);
-- ---------------------------------------------------------------------------
-- 4. Simplify gq_select_member policy (group quests visible via completion)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS gq_select_member ON public.group_quests;
CREATE POLICY gq_select_member ON public.group_quests FOR SELECT TO authenticated USING (
  public.is_group_member(group_quests.group_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.quest_completions qc
    WHERE qc.group_quest_id = group_quests.id
      AND qc.status = 'active'
      AND public.can_view_completion(
        auth.uid(),
        qc.user_id,
        qc.status,
        qc.visibility,
        qc.quest_source_type,
        qc.group_id
      )
  )
);
