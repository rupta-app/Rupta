-- Spontaneous user-created SideQuests: posted as unofficial feed, pending catalog review

ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS is_spontaneous BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS spontaneous_review_status TEXT CHECK (
    spontaneous_review_status IS NULL
    OR spontaneous_review_status IN ('pending_catalog', 'promoted', 'rejected')
  );

CREATE INDEX IF NOT EXISTS idx_quests_spontaneous ON public.quests (is_spontaneous) WHERE is_spontaneous = TRUE;

COMMENT ON COLUMN public.quests.is_spontaneous IS 'User-submitted quest; hidden from catalog browse via app filter';
COMMENT ON COLUMN public.quests.spontaneous_review_status IS 'Review pipeline for spontaneous → optional promotion to catalog';

-- quest_completions: add spontaneous source
ALTER TABLE public.quest_completions DROP CONSTRAINT IF EXISTS quest_completions_quest_source_type_check;
ALTER TABLE public.quest_completions ADD CONSTRAINT quest_completions_quest_source_type_check CHECK (
  quest_source_type IN ('official', 'group', 'spontaneous')
);

ALTER TABLE public.quest_completions DROP CONSTRAINT IF EXISTS quest_completions_source_consistency;
ALTER TABLE public.quest_completions ADD CONSTRAINT quest_completions_source_consistency CHECK (
  (quest_source_type = 'official' AND quest_id IS NOT NULL AND group_quest_id IS NULL)
  OR
  (quest_source_type = 'group' AND group_quest_id IS NOT NULL AND group_id IS NOT NULL AND quest_id IS NULL)
  OR
  (quest_source_type = 'spontaneous' AND quest_id IS NOT NULL AND group_quest_id IS NULL)
);

-- Aura: spontaneous counts toward profile official aura (same as catalog completions)
CREATE OR REPLACE FUNCTION public.sync_completion_aura_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quest_source_type = 'group' THEN
    NEW.aura_scope := 'group';
  ELSIF NEW.quest_source_type = 'official' OR NEW.quest_source_type = 'spontaneous' THEN
    NEW.aura_scope := 'official';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_and_set_quest_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  q public.quests%ROWTYPE;
  gq public.group_quests%ROWTYPE;
  cnt INTEGER;
  last_done TIMESTAMPTZ;
BEGIN
  IF NEW.quest_source_type = 'official' OR NEW.quest_source_type IS NULL THEN
    NEW.quest_source_type := COALESCE(NEW.quest_source_type, 'official');
    SELECT * INTO q FROM public.quests WHERE id = NEW.quest_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Quest not found';
    END IF;
    IF q.is_spontaneous THEN
      RAISE EXCEPTION 'Use spontaneous flow for user-created quests';
    END IF;

    IF q.repeatability_type = 'once' THEN
      SELECT COUNT(*) INTO cnt FROM public.quest_completions
      WHERE user_id = NEW.user_id AND quest_id = NEW.quest_id AND status <> 'removed';
      IF cnt > 0 THEN
        RAISE EXCEPTION 'Quest already completed (once)';
      END IF;
    ELSIF q.repeatability_type = 'limited' THEN
      SELECT COUNT(*) INTO cnt FROM public.quest_completions
      WHERE user_id = NEW.user_id AND quest_id = NEW.quest_id AND status <> 'removed';
      IF cnt >= COALESCE(q.max_completions_per_user, 1) THEN
        RAISE EXCEPTION 'Max completions for this quest reached';
      END IF;
    ELSIF q.repeatability_type = 'repeatable' AND q.repeat_interval IS NOT NULL THEN
      SELECT completed_at INTO last_done FROM public.quest_completions
      WHERE user_id = NEW.user_id AND quest_id = NEW.quest_id AND status <> 'removed'
      ORDER BY completed_at DESC LIMIT 1;
      IF last_done IS NOT NULL THEN
        IF q.repeat_interval = 'weekly' AND last_done > NOW() - INTERVAL '7 days' THEN
          RAISE EXCEPTION 'Weekly cooldown not met';
        ELSIF q.repeat_interval = 'monthly' AND last_done > NOW() - INTERVAL '30 days' THEN
          RAISE EXCEPTION 'Monthly cooldown not met';
        ELSIF q.repeat_interval = 'yearly' AND last_done > NOW() - INTERVAL '365 days' THEN
          RAISE EXCEPTION 'Yearly cooldown not met';
        END IF;
      END IF;
    END IF;

    NEW.aura_earned := q.aura_reward;
    RETURN NEW;
  END IF;

  IF NEW.quest_source_type = 'spontaneous' THEN
    SELECT * INTO q FROM public.quests WHERE id = NEW.quest_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Quest not found';
    END IF;
    IF NOT q.is_spontaneous THEN
      RAISE EXCEPTION 'Not a spontaneous quest row';
    END IF;
    IF q.created_by IS NULL OR q.created_by <> NEW.user_id THEN
      RAISE EXCEPTION 'Spontaneous quest must be completed by its creator';
    END IF;
    SELECT COUNT(*) INTO cnt FROM public.quest_completions
    WHERE quest_id = NEW.quest_id AND status <> 'removed';
    IF cnt > 0 THEN
      RAISE EXCEPTION 'This spontaneous SideQuest was already posted';
    END IF;
    NEW.aura_earned := 0;
    RETURN NEW;
  END IF;

  IF NEW.quest_source_type = 'group' THEN
    SELECT * INTO gq FROM public.group_quests WHERE id = NEW.group_quest_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Group quest not found';
    END IF;
    IF gq.group_id <> NEW.group_id THEN
      RAISE EXCEPTION 'Group mismatch for group quest';
    END IF;
    IF gq.status <> 'active' THEN
      RAISE EXCEPTION 'Group quest is not active';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = NEW.group_id AND gm.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'User is not a member of this group';
    END IF;

    IF NEW.challenge_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.group_challenges gc
        WHERE gc.id = NEW.challenge_id AND gc.group_id = NEW.group_id AND gc.status = 'active'
      ) THEN
        RAISE EXCEPTION 'Invalid or inactive challenge for this group';
      END IF;
    END IF;

    IF gq.repeatability_type = 'once' THEN
      SELECT COUNT(*) INTO cnt FROM public.quest_completions
      WHERE user_id = NEW.user_id AND group_quest_id = NEW.group_quest_id AND status <> 'removed';
      IF cnt > 0 THEN
        RAISE EXCEPTION 'Group quest already completed (once)';
      END IF;
    ELSIF gq.repeatability_type = 'limited' THEN
      SELECT COUNT(*) INTO cnt FROM public.quest_completions
      WHERE user_id = NEW.user_id AND group_quest_id = NEW.group_quest_id AND status <> 'removed';
      IF cnt >= COALESCE(gq.max_completions_per_user, 1) THEN
        RAISE EXCEPTION 'Max completions for this group quest reached';
      END IF;
    ELSIF gq.repeatability_type = 'repeatable' AND gq.repeat_interval IS NOT NULL THEN
      SELECT completed_at INTO last_done FROM public.quest_completions
      WHERE user_id = NEW.user_id AND group_quest_id = NEW.group_quest_id AND status <> 'removed'
      ORDER BY completed_at DESC LIMIT 1;
      IF last_done IS NOT NULL THEN
        IF gq.repeat_interval = 'weekly' AND last_done > NOW() - INTERVAL '7 days' THEN
          RAISE EXCEPTION 'Weekly cooldown not met';
        ELSIF gq.repeat_interval = 'monthly' AND last_done > NOW() - INTERVAL '30 days' THEN
          RAISE EXCEPTION 'Monthly cooldown not met';
        ELSIF gq.repeat_interval = 'yearly' AND last_done > NOW() - INTERVAL '365 days' THEN
          RAISE EXCEPTION 'Yearly cooldown not met';
        END IF;
      END IF;
    END IF;

    NEW.aura_earned := gq.aura_reward;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid quest_source_type';
END;
$$;

-- Authenticated users may insert only spontaneous quest shells they own
DROP POLICY IF EXISTS quests_insert_spontaneous ON public.quests;
CREATE POLICY quests_insert_spontaneous ON public.quests FOR INSERT TO authenticated
WITH CHECK (
  is_spontaneous = TRUE
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS quests_delete_own_spontaneous ON public.quests;
CREATE POLICY quests_delete_own_spontaneous ON public.quests FOR DELETE TO authenticated
USING (is_spontaneous = TRUE AND created_by = auth.uid());
