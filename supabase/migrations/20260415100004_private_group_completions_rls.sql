-- Completions from private groups should only be visible to group members,
-- even if the completion itself has visibility = 'public' or 'friends'.
-- The group's privacy setting takes precedence.

DROP POLICY IF EXISTS completions_select ON public.quest_completions;
CREATE POLICY completions_select ON public.quest_completions FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR (
    status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE b.blocker_id = auth.uid() AND b.blocked_id = quest_completions.user_id
    )
    -- Private group gate: if the completion belongs to a private group,
    -- the viewer must be a member. Public groups and non-group completions pass through.
    AND (
      quest_source_type <> 'group'
      OR group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.group_settings s
        WHERE s.group_id = quest_completions.group_id AND s.is_public = TRUE
      )
      OR public.is_group_member(quest_completions.group_id, auth.uid())
    )
    -- Normal visibility rules
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
