-- Rupta: groups-first architecture, dual quest system, scoped AURA, challenges

-- ---------------------------------------------------------------------------
-- profiles: freemium plan flag
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro'));
-- ---------------------------------------------------------------------------
-- group_members: admin role
-- ---------------------------------------------------------------------------
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_role_check CHECK (role IN ('owner', 'admin', 'member'));
-- ---------------------------------------------------------------------------
-- group_settings (one row per group)
-- ---------------------------------------------------------------------------
CREATE TABLE public.group_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL UNIQUE REFERENCES public.groups (id) ON DELETE CASCADE,
  quest_creation_rule TEXT NOT NULL DEFAULT 'anyone' CHECK (
    quest_creation_rule IN ('anyone', 'admin_only', 'admin_approval')
  ),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_group_settings_public ON public.group_settings (is_public) WHERE is_public = TRUE;
-- ---------------------------------------------------------------------------
-- group_quests
-- ---------------------------------------------------------------------------
CREATE TABLE public.group_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  aura_reward INTEGER NOT NULL DEFAULT 0 CHECK (aura_reward >= 0),
  category TEXT,
  proof_type TEXT NOT NULL DEFAULT 'photo' CHECK (proof_type IN ('photo', 'video', 'either')),
  repeatability_type TEXT NOT NULL DEFAULT 'once' CHECK (
    repeatability_type IN ('once', 'limited', 'repeatable')
  ),
  max_completions_per_user INTEGER,
  repeat_interval TEXT CHECK (repeat_interval IS NULL OR repeat_interval IN ('weekly', 'monthly', 'yearly')),
  visibility TEXT NOT NULL DEFAULT 'group_only' CHECK (visibility IN ('group_only', 'public')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft',
      'active',
      'archived',
      'submitted_for_review',
      'approved_as_official',
      'rejected'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_group_quests_group ON public.group_quests (group_id);
CREATE INDEX idx_group_quests_status ON public.group_quests (group_id, status);
-- ---------------------------------------------------------------------------
-- group_challenges
-- ---------------------------------------------------------------------------
CREATE TABLE public.group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_description TEXT,
  scoring_mode TEXT NOT NULL DEFAULT 'mixed' CHECK (
    scoring_mode IN ('official_only', 'group_only', 'mixed')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_group_challenges_group ON public.group_challenges (group_id);
CREATE INDEX idx_group_challenges_active ON public.group_challenges (group_id, status);
-- ---------------------------------------------------------------------------
-- Scoring tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.group_member_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  total_group_aura INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX idx_group_member_scores_group ON public.group_member_scores (group_id);
CREATE INDEX idx_group_member_scores_leader ON public.group_member_scores (group_id, total_group_aura DESC);
CREATE TABLE public.challenge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.group_challenges (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, user_id)
);
CREATE INDEX idx_challenge_scores_challenge ON public.challenge_scores (challenge_id, score DESC);
-- ---------------------------------------------------------------------------
-- quest_completions: dual quest system + visibility + challenge link
-- ---------------------------------------------------------------------------
ALTER TABLE public.quest_completions
  ADD COLUMN IF NOT EXISTS quest_source_type TEXT NOT NULL DEFAULT 'official' CHECK (
    quest_source_type IN ('official', 'group')
  ),
  ADD COLUMN IF NOT EXISTS group_quest_id UUID REFERENCES public.group_quests (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES public.group_challenges (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (
    visibility IN ('public', 'friends', 'group', 'private')
  ),
  ADD COLUMN IF NOT EXISTS aura_scope TEXT NOT NULL DEFAULT 'official' CHECK (aura_scope IN ('official', 'group'));
-- Allow NULL quest_id for group completions only
ALTER TABLE public.quest_completions ALTER COLUMN quest_id DROP NOT NULL;
ALTER TABLE public.quest_completions DROP CONSTRAINT IF EXISTS quest_completions_source_consistency;
ALTER TABLE public.quest_completions ADD CONSTRAINT quest_completions_source_consistency CHECK (
  (quest_source_type = 'official' AND quest_id IS NOT NULL AND group_quest_id IS NULL)
  OR
  (quest_source_type = 'group' AND group_quest_id IS NOT NULL AND group_id IS NOT NULL AND quest_id IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_completions_source ON public.quest_completions (quest_source_type);
CREATE INDEX IF NOT EXISTS idx_completions_group ON public.quest_completions (group_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completions_challenge ON public.quest_completions (challenge_id);
-- ---------------------------------------------------------------------------
-- Default aura_scope from quest_source_type (enforce consistency on write)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_completion_aura_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quest_source_type = 'group' THEN
    NEW.aura_scope := 'group';
  ELSIF NEW.quest_source_type = 'official' THEN
    NEW.aura_scope := 'official';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_quest_completion_aura_scope
  BEFORE INSERT OR UPDATE OF quest_source_type ON public.quest_completions
  FOR EACH ROW EXECUTE FUNCTION public.sync_completion_aura_scope();
-- ---------------------------------------------------------------------------
-- Replace validation: official vs group quest
-- ---------------------------------------------------------------------------
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

  -- Group quest path
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
-- ---------------------------------------------------------------------------
-- Challenge: does this completion add to challenge score?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.completion_counts_for_challenge(
  p_challenge_id UUID,
  p_aura_scope TEXT,
  p_group_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  ch public.group_challenges%ROWTYPE;
BEGIN
  SELECT * INTO ch FROM public.group_challenges WHERE id = p_challenge_id;
  IF NOT FOUND OR ch.status <> 'active' THEN
    RETURN FALSE;
  END IF;
  IF p_group_id IS NULL OR ch.group_id <> p_group_id THEN
    RETURN FALSE;
  END IF;
  IF ch.scoring_mode = 'mixed' THEN
    RETURN TRUE;
  END IF;
  IF ch.scoring_mode = 'official_only' AND p_aura_scope = 'official' THEN
    RETURN TRUE;
  END IF;
  IF ch.scoring_mode = 'group_only' AND p_aura_scope = 'group' THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;
-- ---------------------------------------------------------------------------
-- Award AURA / group scores / challenge scores
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_aura_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  add_challenge BOOLEAN;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF NEW.aura_scope = 'official' THEN
    UPDATE public.profiles
    SET
      total_aura = total_aura + NEW.aura_earned,
      yearly_aura = yearly_aura + NEW.aura_earned,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  IF NEW.aura_scope = 'group' AND NEW.group_id IS NOT NULL THEN
    INSERT INTO public.group_member_scores (group_id, user_id, total_group_aura, updated_at)
    VALUES (NEW.group_id, NEW.user_id, NEW.aura_earned, NOW())
    ON CONFLICT (group_id, user_id)
    DO UPDATE SET
      total_group_aura = public.group_member_scores.total_group_aura + EXCLUDED.total_group_aura,
      updated_at = NOW();
  END IF;

  IF NEW.challenge_id IS NOT NULL THEN
    add_challenge := public.completion_counts_for_challenge(
      NEW.challenge_id,
      NEW.aura_scope,
      NEW.group_id
    );
    IF add_challenge THEN
      INSERT INTO public.challenge_scores (challenge_id, user_id, score, updated_at)
      VALUES (NEW.challenge_id, NEW.user_id, NEW.aura_earned, NOW())
      ON CONFLICT (challenge_id, user_id)
      DO UPDATE SET
        score = public.challenge_scores.score + EXCLUDED.score,
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
-- ---------------------------------------------------------------------------
-- Clawback on removal
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_aura_on_completion_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  had_challenge BOOLEAN;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'removed' THEN
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
  END IF;
  RETURN NEW;
END;
$$;
-- ---------------------------------------------------------------------------
-- group_settings row when group is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_group_settings_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_settings (group_id)
  VALUES (NEW.id)
  ON CONFLICT (group_id) DO NOTHING;
  RETURN NEW;
END;
$$;
-- Note: SECURITY DEFINER inserts bypass RLS on group_settings

CREATE TRIGGER trg_group_settings_row
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_settings_row();
-- Backfill settings for existing groups
INSERT INTO public.group_settings (group_id)
SELECT g.id FROM public.groups g
WHERE NOT EXISTS (SELECT 1 FROM public.group_settings s WHERE s.group_id = g.id)
ON CONFLICT (group_id) DO NOTHING;
-- ---------------------------------------------------------------------------
-- RLS new tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_scores ENABLE ROW LEVEL SECURITY;
-- Helper: is member of group
-- group_settings: members can read; owner/admin can update
CREATE POLICY gs_select_member ON public.group_settings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_settings.group_id AND m.user_id = auth.uid())
);
CREATE POLICY gs_update_admin ON public.group_settings FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = group_settings.group_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  )
);
-- group_quests
CREATE POLICY gq_select_member ON public.group_quests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_quests.group_id AND m.user_id = auth.uid())
);
CREATE POLICY gq_insert_member ON public.group_quests FOR INSERT TO authenticated WITH CHECK (
  creator_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_quests.group_id AND m.user_id = auth.uid())
);
CREATE POLICY gq_update_creator_admin ON public.group_quests FOR UPDATE TO authenticated USING (
  creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = group_quests.group_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
  )
);
-- group_challenges
CREATE POLICY gc_select_member ON public.group_challenges FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_challenges.group_id AND m.user_id = auth.uid())
);
CREATE POLICY gc_insert_member ON public.group_challenges FOR INSERT TO authenticated WITH CHECK (
  creator_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = group_challenges.group_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY gc_update_admin ON public.group_challenges FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = group_challenges.group_id AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
  )
);
-- group_member_scores
CREATE POLICY gms_select_member ON public.group_member_scores FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_member_scores.group_id AND m.user_id = auth.uid())
);
-- challenge_scores
CREATE POLICY cs_select_member ON public.challenge_scores FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.group_challenges gc
    JOIN public.group_members m ON m.group_id = gc.group_id AND m.user_id = auth.uid()
    WHERE gc.id = challenge_scores.challenge_id
  )
);
-- ---------------------------------------------------------------------------
-- Groups: allow reading public groups (for discovery / join)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS groups_select_member ON public.groups;
CREATE POLICY groups_select_visible ON public.groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = groups.id AND m.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.group_settings s
    WHERE s.group_id = groups.id AND s.is_public = TRUE
  )
);
-- ---------------------------------------------------------------------------
-- Join public group: self-insert as member
-- ---------------------------------------------------------------------------
CREATE POLICY gm_insert_join_public ON public.group_members FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_settings s
    WHERE s.group_id = group_members.group_id AND s.is_public = TRUE
  )
);
-- ---------------------------------------------------------------------------
-- quest_completions SELECT: respect visibility for non-owners
-- ---------------------------------------------------------------------------
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
        AND EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = quest_completions.group_id AND gm.user_id = auth.uid()
        )
      )
    )
  )
);
-- ---------------------------------------------------------------------------
-- quest_media SELECT: align with completion visibility
-- ---------------------------------------------------------------------------
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
              AND (
                EXISTS (
                  SELECT 1 FROM public.friendships f
                  WHERE (f.user_a_id = auth.uid() AND f.user_b_id = c.user_id)
                     OR (f.user_b_id = auth.uid() AND f.user_a_id = c.user_id)
                )
              )
            )
            OR (
              c.visibility = 'group'
              AND c.group_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM public.group_members gm
                WHERE gm.group_id = c.group_id AND gm.user_id = auth.uid()
              )
            )
          )
        )
      )
  )
);
