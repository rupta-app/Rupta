-- comment_reactions: allows users to like individual comments
-- Mirrors the existing reactions table pattern (which is for completion likes)

CREATE TABLE public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, comment_id)
);
CREATE INDEX idx_comment_reactions_comment ON public.comment_reactions (comment_id);
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY comment_reactions_select ON public.comment_reactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY comment_reactions_insert_own ON public.comment_reactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY comment_reactions_delete_own ON public.comment_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());
