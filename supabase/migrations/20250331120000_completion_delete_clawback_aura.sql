-- When quest_completions rows are deleted (e.g. CASCADE from quest removal), claw back
-- AURA / group / challenge scores the same way as setting status to 'removed', so profiles
-- stay consistent with visible completions.

CREATE OR REPLACE FUNCTION public.adjust_aura_on_completion_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  had_challenge BOOLEAN;
BEGIN
  IF OLD.status <> 'active' THEN
    RETURN OLD;
  END IF;

  IF OLD.aura_scope = 'official' THEN
    UPDATE public.profiles
    SET
      total_aura = GREATEST(0, total_aura - OLD.aura_earned),
      yearly_aura = GREATEST(0, yearly_aura - OLD.aura_earned),
      updated_at = NOW()
    WHERE id = OLD.user_id;
  END IF;

  IF OLD.aura_scope = 'group' AND OLD.group_id IS NOT NULL THEN
    UPDATE public.group_member_scores
    SET
      total_group_aura = GREATEST(0, total_group_aura - OLD.aura_earned),
      updated_at = NOW()
    WHERE group_id = OLD.group_id AND user_id = OLD.user_id;
  END IF;

  IF OLD.challenge_id IS NOT NULL THEN
    had_challenge := public.completion_counts_for_challenge(
      OLD.challenge_id,
      OLD.aura_scope,
      OLD.group_id
    );
    IF had_challenge THEN
      UPDATE public.challenge_scores
      SET
        score = GREATEST(0, score - OLD.aura_earned),
        updated_at = NOW()
      WHERE challenge_id = OLD.challenge_id AND user_id = OLD.user_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS trg_quest_completion_delete_aura ON public.quest_completions;
CREATE TRIGGER trg_quest_completion_delete_aura
  BEFORE DELETE ON public.quest_completions
  FOR EACH ROW EXECUTE FUNCTION public.adjust_aura_on_completion_delete();
