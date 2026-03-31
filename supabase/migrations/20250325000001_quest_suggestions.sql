-- User-submitted quest ideas (reviewed manually / by admin)
CREATE TABLE public.quest_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quest_suggestions_created ON public.quest_suggestions (created_at DESC);

ALTER TABLE public.quest_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY quest_suggestions_insert_own ON public.quest_suggestions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY quest_suggestions_select_own ON public.quest_suggestions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
