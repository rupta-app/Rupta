export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileStatus = 'normal' | 'warned' | 'flagged_cheater';
export type CompletionStatus = 'active' | 'under_review' | 'removed';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type GroupRole = 'owner' | 'admin' | 'member';
export type QuestSourceType = 'official' | 'group' | 'spontaneous';
export type SpontaneousReviewStatus = 'pending_catalog' | 'promoted' | 'rejected';
export type AuraScope = 'official' | 'group';
export type AchievementVisibility = 'public' | 'friends' | 'group' | 'private';
export type GroupQuestStatus =
  | 'draft'
  | 'active'
  | 'archived'
  | 'submitted_for_review'
  | 'approved_as_official'
  | 'rejected';
export type ChallengeStatus = 'active' | 'completed' | 'cancelled';
export type ChallengeScoringMode = 'official_only' | 'group_only' | 'mixed';
export type QuestCreationRule = 'anyone' | 'admin_only' | 'admin_approval';
export type UserPlan = 'free' | 'pro';
export type ReportReason =
  | 'fake_proof'
  | 'stolen_image'
  | 'harassment'
  | 'dangerous_content'
  | 'spam';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type NotificationType =
  | 'friend_request'
  | 'comment'
  | 'respect'
  | 'weekly_quest'
  | 'group_invite';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          date_of_birth: string | null;
          preferred_language: string;
          preferred_categories: string[];
          activity_styles: string[];
          total_aura: number;
          yearly_aura: number;
          status: ProfileStatus;
          onboarding_completed: boolean;
          is_admin: boolean;
          /** Present after DB migration; treat missing as free in app code */
          plan?: UserPlan;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          username: string;
          display_name: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      quests: {
        Row: {
          id: string;
          title_en: string;
          title_es: string;
          description_en: string;
          description_es: string;
          category: string;
          aura_reward: number;
          difficulty: string;
          repeatability_type: string;
          max_completions_per_user: number | null;
          repeat_interval: string | null;
          proof_type: string;
          cost_range: string;
          location_type: string;
          is_active: boolean;
          is_spontaneous: boolean;
          created_by: string | null;
          spontaneous_review_status: SpontaneousReviewStatus | null;
          created_at: string;
        };
        Insert: {
          title_en: string;
          title_es: string;
          description_en: string;
          description_es: string;
          category: string;
          aura_reward: number;
          difficulty: string;
          repeatability_type: string;
          max_completions_per_user?: number | null;
          repeat_interval?: string | null;
          proof_type?: string;
          cost_range?: string;
          location_type?: string;
          is_active?: boolean;
          is_spontaneous?: boolean;
          created_by?: string | null;
          spontaneous_review_status?: SpontaneousReviewStatus | null;
        };
        Update: Partial<Omit<Database['public']['Tables']['quests']['Row'], 'id' | 'created_at'>>;
      };
      quest_completions: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string | null;
          group_quest_id: string | null;
          group_id: string | null;
          challenge_id: string | null;
          quest_source_type: QuestSourceType;
          visibility: AchievementVisibility;
          aura_scope: AuraScope;
          caption: string | null;
          rating: number | null;
          aura_earned: number;
          status: CompletionStatus;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          quest_id?: string | null;
          group_quest_id?: string | null;
          group_id?: string | null;
          challenge_id?: string | null;
          quest_source_type?: QuestSourceType;
          visibility?: AchievementVisibility;
          aura_scope?: AuraScope;
          caption?: string | null;
          rating?: number | null;
          status?: CompletionStatus;
          completed_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['quest_completions']['Row'], 'id'>>;
      };
      quest_media: {
        Row: {
          id: string;
          completion_id: string;
          media_url: string;
          media_type: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          completion_id: string;
          media_url: string;
          media_type: string;
          order_index?: number;
        };
        Update: never;
      };
      completion_participants: {
        Row: {
          id: string;
          completion_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: { completion_id: string; user_id: string };
        Update: never;
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          completion_id: string;
          created_at: string;
        };
        Insert: { user_id: string; completion_id: string };
        Update: never;
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          completion_id: string;
          content: string;
          created_at: string;
        };
        Insert: { user_id: string; completion_id: string; content: string };
        Update: { content?: string };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: FriendRequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          sender_id: string;
          receiver_id: string;
          status?: FriendRequestStatus;
        };
        Update: { status?: FriendRequestStatus };
      };
      friendships: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          owner_id: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'owner_id'>>;
      };
      group_settings: {
        Row: {
          id: string;
          group_id: string;
          quest_creation_rule: QuestCreationRule;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          group_id: string;
          quest_creation_rule?: QuestCreationRule;
          is_public?: boolean;
        };
        Update: Partial<
          Pick<Database['public']['Tables']['group_settings']['Row'], 'quest_creation_rule' | 'is_public'>
        >;
      };
      group_quests: {
        Row: {
          id: string;
          group_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          aura_reward: number;
          category: string | null;
          proof_type: string;
          repeatability_type: string;
          max_completions_per_user: number | null;
          repeat_interval: string | null;
          visibility: string;
          status: GroupQuestStatus;
          created_at: string;
        };
        Insert: {
          group_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          aura_reward?: number;
          category?: string | null;
          proof_type?: string;
          repeatability_type?: string;
          max_completions_per_user?: number | null;
          repeat_interval?: string | null;
          visibility?: string;
          status?: GroupQuestStatus;
        };
        Update: Partial<
          Omit<Database['public']['Tables']['group_quests']['Row'], 'id' | 'group_id' | 'creator_id' | 'created_at'>
        >;
      };
      group_challenges: {
        Row: {
          id: string;
          group_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          prize_description: string | null;
          scoring_mode: ChallengeScoringMode;
          status: ChallengeStatus;
          created_at: string;
        };
        Insert: {
          group_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          prize_description?: string | null;
          scoring_mode?: ChallengeScoringMode;
          status?: ChallengeStatus;
        };
        Update: Partial<
          Omit<
            Database['public']['Tables']['group_challenges']['Row'],
            'id' | 'group_id' | 'creator_id' | 'created_at'
          >
        >;
      };
      group_member_scores: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          total_group_aura: number;
          updated_at: string;
        };
        Insert: never;
        Update: never;
      };
      challenge_scores: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          score: number;
          updated_at: string;
        };
        Insert: never;
        Update: never;
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: { group_id: string; user_id: string; role?: GroupRole };
        Update: never;
      };
      group_invites: {
        Row: {
          id: string;
          group_id: string;
          inviter_id: string;
          invitee_id: string;
          status: FriendRequestStatus;
          created_at: string;
        };
        Insert: {
          group_id: string;
          inviter_id: string;
          invitee_id: string;
          status?: FriendRequestStatus;
        };
        Update: { status?: FriendRequestStatus };
      };
      saved_quests: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string;
          created_at: string;
        };
        Insert: { user_id: string; quest_id: string };
        Update: never;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          completion_id: string | null;
          reported_user_id: string | null;
          reason: ReportReason;
          description: string | null;
          status: ReportStatus;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          reporter_id: string;
          completion_id?: string | null;
          reported_user_id?: string | null;
          reason: ReportReason;
          description?: string | null;
          status?: ReportStatus;
        };
        Update: Partial<
          Pick<
            Database['public']['Tables']['reports']['Row'],
            'status' | 'reviewed_at' | 'reviewed_by'
          >
        >;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data?: Json;
          is_read?: boolean;
        };
        Update: { is_read?: boolean };
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: { blocker_id: string; blocked_id: string };
        Update: never;
      };
    };
  };
}
