-- Spontaneous posts: no AURA until reviewers set aura_earned (e.g. after promotion).
-- INSERT keeps aura_earned = 0; UPDATE on aura_earned applies the delta to profiles / group / challenges.

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

CREATE OR REPLACE FUNCTION public.apply_completion_aura_earned_delta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta INTEGER;
  add_challenge BOOLEAN;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;
  delta := NEW.aura_earned - OLD.aura_earned;
  IF delta = 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.aura_scope = 'official' THEN
    UPDATE public.profiles
    SET
      total_aura = GREATEST(0, total_aura + delta),
      yearly_aura = GREATEST(0, yearly_aura + delta),
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  IF NEW.aura_scope = 'group' AND NEW.group_id IS NOT NULL THEN
    UPDATE public.group_member_scores
    SET
      total_group_aura = GREATEST(0, total_group_aura + delta),
      updated_at = NOW()
    WHERE group_id = NEW.group_id AND user_id = NEW.user_id;
  END IF;

  IF NEW.challenge_id IS NOT NULL THEN
    add_challenge := public.completion_counts_for_challenge(
      NEW.challenge_id,
      NEW.aura_scope,
      NEW.group_id
    );
    IF add_challenge THEN
      INSERT INTO public.challenge_scores (challenge_id, user_id, score, updated_at)
      VALUES (NEW.challenge_id, NEW.user_id, GREATEST(0, delta), NOW())
      ON CONFLICT (challenge_id, user_id)
      DO UPDATE SET
        score = GREATEST(0, public.challenge_scores.score + EXCLUDED.score),
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quest_completion_aura_earned_delta ON public.quest_completions;
CREATE TRIGGER trg_quest_completion_aura_earned_delta
  AFTER UPDATE OF aura_earned ON public.quest_completions
  FOR EACH ROW
  WHEN (OLD.aura_earned IS DISTINCT FROM NEW.aura_earned)
  EXECUTE FUNCTION public.apply_completion_aura_earned_delta();

COMMENT ON FUNCTION public.apply_completion_aura_earned_delta() IS
  'When reviewers raise aura_earned (e.g. spontaneous approved), apply delta to profile/group/challenge scores.';

-- Reviewer example (service role / SQL editor):
-- UPDATE public.quest_completions
--   SET aura_earned = 42, quest_source_type = 'official'
--   WHERE id = '<completion_uuid>';
-- UPDATE public.quests SET is_spontaneous = false, spontaneous_review_status = 'promoted'
--   WHERE id = (SELECT quest_id FROM public.quest_completions WHERE id = '<completion_uuid>');
