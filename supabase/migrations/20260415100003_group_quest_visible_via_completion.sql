-- Allow reading group quests when the viewer can see a completion that
-- references them (friend's completion with public/friends visibility,
-- or the viewer's own completion).  This fixes the infinite-loading bug
-- when tapping a group-quest completion from the feed as a non-member.

DROP POLICY IF EXISTS gq_select_member ON public.group_quests;
CREATE POLICY gq_select_member ON public.group_quests FOR SELECT TO authenticated USING (
  public.is_group_member(group_quests.group_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.quest_completions qc
    WHERE qc.group_quest_id = group_quests.id
      AND qc.status = 'active'
      AND (
        qc.user_id = auth.uid()
        OR qc.visibility = 'public'
        OR (
          qc.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE (f.user_a_id = auth.uid() AND f.user_b_id = qc.user_id)
               OR (f.user_b_id = auth.uid() AND f.user_a_id = qc.user_id)
          )
        )
      )
  )
);
