-- Allow owners to delete their own completions. CASCADE removes related rows; RLS must
-- allow those child deletes when triggered by the completion owner's session.

DROP POLICY IF EXISTS completions_delete_own ON public.quest_completions;
CREATE POLICY completions_delete_own ON public.quest_completions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS quest_media_delete_completion_owner ON public.quest_media;
CREATE POLICY quest_media_delete_completion_owner ON public.quest_media FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = quest_media.completion_id AND c.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS participants_delete_completion_owner ON public.completion_participants;
CREATE POLICY participants_delete_completion_owner ON public.completion_participants FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = completion_participants.completion_id AND c.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS reactions_delete_completion_owner ON public.reactions;
CREATE POLICY reactions_delete_completion_owner ON public.reactions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = reactions.completion_id AND c.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS comments_delete_completion_owner ON public.comments;
CREATE POLICY comments_delete_completion_owner ON public.comments FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = comments.completion_id AND c.user_id = auth.uid()
  )
);
