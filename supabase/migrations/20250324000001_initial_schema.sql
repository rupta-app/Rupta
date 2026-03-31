-- Rupta initial schema
-- Run via Supabase CLI or SQL editor

-- UUID defaults use gen_random_uuid() (built-in on Postgres 13+; avoids uuid-ossp search_path issues on Supabase)

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  date_of_birth DATE,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'es')),
  preferred_categories TEXT[] NOT NULL DEFAULT '{}',
  activity_styles TEXT[] NOT NULL DEFAULT '{}',
  total_aura INTEGER NOT NULL DEFAULT 0,
  yearly_aura INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warned', 'flagged_cheater')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username_lower ON public.profiles (LOWER(username));
CREATE INDEX idx_profiles_total_aura ON public.profiles (total_aura DESC);
CREATE INDEX idx_profiles_yearly_aura ON public.profiles (yearly_aura DESC);

CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'fitness', 'outdoors', 'social', 'creativity', 'travel', 'food', 'learning', 'random', 'personal_growth'
  )),
  aura_reward INTEGER NOT NULL CHECK (aura_reward >= 0),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  repeatability_type TEXT NOT NULL CHECK (repeatability_type IN ('once', 'limited', 'repeatable')),
  max_completions_per_user INTEGER,
  repeat_interval TEXT CHECK (repeat_interval IS NULL OR repeat_interval IN ('weekly', 'monthly', 'yearly')),
  proof_type TEXT NOT NULL DEFAULT 'photo' CHECK (proof_type IN ('photo', 'video', 'either')),
  cost_range TEXT NOT NULL DEFAULT 'free' CHECK (cost_range IN ('free', 'low', 'medium', 'high')),
  location_type TEXT NOT NULL DEFAULT 'any' CHECK (location_type IN ('indoor', 'outdoor', 'any')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quests_category ON public.quests (category);
CREATE INDEX idx_quests_active ON public.quests (is_active);

CREATE TABLE public.quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests (id) ON DELETE CASCADE,
  caption TEXT,
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  aura_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'removed')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_completions_user ON public.quest_completions (user_id);
CREATE INDEX idx_completions_quest ON public.quest_completions (quest_id);
CREATE INDEX idx_completions_completed_at ON public.quest_completions (completed_at DESC);
CREATE INDEX idx_completions_feed ON public.quest_completions (status, completed_at DESC);

CREATE TABLE public.quest_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID NOT NULL REFERENCES public.quest_completions (id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  order_index SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.completion_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID NOT NULL REFERENCES public.quest_completions (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (completion_id, user_id)
);

CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  completion_id UUID NOT NULL REFERENCES public.quest_completions (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, completion_id)
);

CREATE INDEX idx_reactions_completion ON public.reactions (completion_id);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  completion_id UUID NOT NULL REFERENCES public.quest_completions (id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_completion ON public.comments (completion_id);

CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests (receiver_id, status);

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);

CREATE INDEX idx_friendships_a ON public.friendships (user_a_id);
CREATE INDEX idx_friendships_b ON public.friendships (user_b_id);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members (group_id);
CREATE INDEX idx_group_members_user ON public.group_members (user_id);

CREATE TABLE public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX group_invites_one_pending ON public.group_invites (group_id, invitee_id)
  WHERE status = 'pending';

CREATE TABLE public.saved_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, quest_id)
);

CREATE INDEX idx_saved_quests_user ON public.saved_quests (user_id);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  completion_id UUID REFERENCES public.quest_completions (id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'fake_proof', 'stolen_image', 'harassment', 'dangerous_content', 'spam'
  )),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles (id)
);

CREATE INDEX idx_reports_status ON public.reports (status);
CREATE INDEX idx_reports_completion ON public.reports (completion_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'friend_request', 'comment', 'respect', 'weekly_quest', 'group_invite'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocked_blocker ON public.blocked_users (blocker_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || replace(gen_random_uuid()::text, '-', '')),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Rupta User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Quest completion validation + aura from quest
CREATE OR REPLACE FUNCTION public.validate_and_set_quest_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  q public.quests%ROWTYPE;
  cnt INTEGER;
  last_done TIMESTAMPTZ;
BEGIN
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
END;
$$;

CREATE TRIGGER trg_quest_completion_validate
  BEFORE INSERT ON public.quest_completions
  FOR EACH ROW EXECUTE FUNCTION public.validate_and_set_quest_completion();

-- Award AURA on active completion insert
CREATE OR REPLACE FUNCTION public.award_aura_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET
      total_aura = total_aura + NEW.aura_earned,
      yearly_aura = yearly_aura + NEW.aura_earned,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quest_completion_aura
  AFTER INSERT ON public.quest_completions
  FOR EACH ROW EXECUTE FUNCTION public.award_aura_on_completion();

-- Subtract AURA if completion removed after being active (moderation)
CREATE OR REPLACE FUNCTION public.adjust_aura_on_completion_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'removed' THEN
    UPDATE public.profiles
    SET
      total_aura = GREATEST(0, total_aura - OLD.aura_earned),
      yearly_aura = GREATEST(0, yearly_aura - OLD.aura_earned),
      updated_at = NOW()
    WHERE id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quest_completion_status_change
  AFTER UPDATE ON public.quest_completions
  FOR EACH ROW EXECUTE FUNCTION public.adjust_aura_on_completion_status();

CREATE OR REPLACE FUNCTION public.touch_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

-- Friend request accepted -> friendship row
CREATE OR REPLACE FUNCTION public.on_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  small_id UUID;
  big_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    IF NEW.sender_id < NEW.receiver_id THEN
      small_id := NEW.sender_id;
      big_id := NEW.receiver_id;
    ELSE
      small_id := NEW.receiver_id;
      big_id := NEW.sender_id;
    END IF;
    INSERT INTO public.friendships (user_a_id, user_b_id)
    VALUES (small_id, big_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.on_friend_request_accepted();

-- Add group owner as first member
CREATE OR REPLACE FUNCTION public.add_group_owner_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_group_owner_member
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_owner_member();

-- Add member when group invite accepted
CREATE OR REPLACE FUNCTION public.on_group_invite_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.group_id, NEW.invitee_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_group_invite_accepted
  AFTER UPDATE ON public.group_invites
  FOR EACH ROW EXECUTE FUNCTION public.on_group_invite_accepted();

-- In-app notifications (server-side)
CREATE OR REPLACE FUNCTION public.notify_on_respect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT user_id INTO owner_id FROM public.quest_completions WHERE id = NEW.completion_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      owner_id,
      'respect',
      'Respect',
      'Someone gave you Respect on a SideQuest.',
      jsonb_build_object('completion_id', NEW.completion_id, 'sender_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_respect
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_respect();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT user_id INTO owner_id FROM public.quest_completions WHERE id = NEW.completion_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      owner_id,
      'comment',
      'New comment',
      'Someone commented on your SideQuest.',
      jsonb_build_object('completion_id', NEW.completion_id, 'sender_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.receiver_id,
      'friend_request',
      'Friend request',
      'You have a new friend request.',
      jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friend_request
  AFTER INSERT ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_request();

CREATE OR REPLACE FUNCTION public.notify_on_group_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.invitee_id,
      'group_invite',
      'Group invite',
      'You were invited to a group.',
      jsonb_build_object('group_id', NEW.group_id, 'inviter_id', NEW.inviter_id, 'invite_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_group_invite
  AFTER INSERT ON public.group_invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_group_invite();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completion_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_authenticated ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Quests
CREATE POLICY quests_select ON public.quests FOR SELECT TO authenticated USING (is_active = TRUE);

-- Quest completions
CREATE POLICY completions_select ON public.quest_completions FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR (
    status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE b.blocker_id = auth.uid() AND b.blocked_id = quest_completions.user_id
    )
  )
);

CREATE POLICY completions_insert_own ON public.quest_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY completions_update_own ON public.quest_completions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Quest media
CREATE POLICY quest_media_select ON public.quest_media FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quest_completions c
    WHERE c.id = quest_media.completion_id
      AND (
        c.user_id = auth.uid()
        OR (
          c.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM public.blocked_users b
            WHERE b.blocker_id = auth.uid() AND b.blocked_id = c.user_id
          )
        )
      )
  )
);
CREATE POLICY quest_media_insert ON public.quest_media FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.quest_completions c WHERE c.id = completion_id AND c.user_id = auth.uid())
);

-- Completion participants
CREATE POLICY participants_select ON public.completion_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY participants_insert ON public.completion_participants FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.quest_completions c WHERE c.id = completion_id AND c.user_id = auth.uid())
);

-- Reactions
CREATE POLICY reactions_select ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY reactions_insert_own ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY reactions_delete_own ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments
CREATE POLICY comments_select ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY comments_insert_own ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Friend requests
CREATE POLICY fr_select ON public.friend_requests FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY fr_insert ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY fr_update ON public.friend_requests FOR UPDATE TO authenticated USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- Friendships (visible if involved)
CREATE POLICY friendships_select ON public.friendships FOR SELECT TO authenticated USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- Groups
CREATE POLICY groups_select_member ON public.groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = groups.id AND m.user_id = auth.uid())
);
CREATE POLICY groups_insert ON public.groups FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- Group members (inserts via SECURITY DEFINER triggers only)
CREATE POLICY gm_select ON public.group_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_members.group_id AND m.user_id = auth.uid())
);

-- Group invites
CREATE POLICY gi_select ON public.group_invites FOR SELECT TO authenticated USING (invitee_id = auth.uid() OR inviter_id = auth.uid());
CREATE POLICY gi_insert ON public.group_invites FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());
CREATE POLICY gi_update_invitee ON public.group_invites FOR UPDATE TO authenticated USING (invitee_id = auth.uid());

-- Saved quests
CREATE POLICY saved_select_own ON public.saved_quests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY saved_mutate_own ON public.saved_quests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Reports
CREATE POLICY reports_insert ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_select_own ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

-- Notifications
CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
-- Self-targeted rows only (e.g. weekly quest reminder generated client-side / future cron)
CREATE POLICY notif_insert_self ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Blocked users
CREATE POLICY blocked_select_own ON public.blocked_users FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY blocked_mutate_own ON public.blocked_users FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

-- Storage bucket (run in dashboard or separate migration)
INSERT INTO storage.buckets (id, name, public)
VALUES ('completion-media', 'completion-media', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "completion_media_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'completion-media');
CREATE POLICY "completion_media_insert_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'completion-media' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "completion_media_delete_own" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'completion-media' AND (storage.foldername(name))[1] = auth.uid()::text
);
