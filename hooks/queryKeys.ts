import type { QueryClient } from '@tanstack/react-query';

export const qk = {
  feed: {
    all: ['feed'] as const,
    home: (userId: string, friendIds: string, filter: string) =>
      ['feed', userId, friendIds, filter] as const,
    group: (groupId: string) => ['group-feed', groupId] as const,
    groupAll: ['group-feed'] as const,
    countsAll: ['feed-counts'] as const,
    respectAll: ['feed-counts-respect'] as const,
    groupCountsAll: ['group-feed-counts'] as const,
    groupRespectAll: ['group-feed-counts-respect'] as const,
  },
  completions: {
    detail: (id: string) => ['completion', id] as const,
    social: (completionId: string, userId?: string) =>
      ['completion-social', completionId, userId] as const,
    socialAll: ['completion-social'] as const,
    comments: (completionId: string) => ['comments', completionId] as const,
    commentSocial: (completionId: string) => ['comment-social', completionId] as const,
  },
  profile: {
    detail: (userId: string) => ['profile', userId] as const,
    stats: (userId: string) => ['profile-stats', userId] as const,
    recent: (userId: string) => ['profile-recent', userId] as const,
    activity: (userId: string) => ['profile-activity', userId] as const,
  },
  groups: {
    all: ['groups'] as const,
    mine: (userId: string) => ['groups', userId] as const,
    detail: (groupId: string) => ['group', groupId] as const,
    detailAll: ['group'] as const,
    settings: (groupId: string) => ['group-settings', groupId] as const,
    invitesAll: ['group-invites'] as const,
    invites: (userId: string) => ['group-invites', userId] as const,
    owned: (userId: string) => ['groups-owned', userId] as const,
    public: (search: string) => ['public-groups', search] as const,
    publicAll: ['public-groups'] as const,
    challengesAll: ['group-challenges'] as const,
    challenges: (groupId: string) => ['group-challenges', groupId] as const,
    groupQuest: (questId: string) => ['group-quest', questId] as const,
    groupQuestAll: ['group-quest'] as const,
    quests: (groupId: string, viewerId?: string) =>
      ['group-quests', groupId, viewerId] as const,
    questsAll: ['group-quests'] as const,
    lb: (groupId: string, period: string) => ['group-lb', groupId, period] as const,
    lbAll: ['group-lb'] as const,
  },
  friends: {
    list: (userId: string) => ['friends', userId] as const,
    listAll: ['friends'] as const,
    ids: (userId: string) => ['friend-ids', userId] as const,
    idsAll: ['friend-ids'] as const,
    requestsIn: (userId: string) => ['friend-requests-in', userId] as const,
    requestsInAll: ['friend-requests-in'] as const,
    relation: ['friend-relation'] as const,
  },
  quests: {
    list: (filters: unknown) => ['quests', filters] as const,
    detail: (id: string) => ['quest', id] as const,
    saved: (userId: string) => ['saved-quests', userId] as const,
    lifeList: (userId: string) => ['life-list', userId] as const,
    officialCount: (userId: string, questId: string) =>
      ['quest-official-count', userId, questId] as const,
    officialCountAll: ['quest-official-count'] as const,
    lifeCompletionCounts: (userId: string, key: string) =>
      ['life-completion-counts', userId, key] as const,
    lifeCompletionCountsAll: ['life-completion-counts'] as const,
    suggested: (userId: string, cats: string) =>
      ['suggested-quest', userId, cats] as const,
  },
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    prefix: ['notifications'] as const,
  },
  challenges: {
    detail: (id: string) => ['challenge', id] as const,
    detailAll: ['challenge'] as const,
    lb: (challengeId: string) => ['challenge-lb', challengeId] as const,
    lbAll: ['challenge-lb'] as const,
    activeCount: (groupId: string) =>
      ['active-challenges-count', groupId] as const,
  },
  leaderboard: {
    global: (period: string) => ['lb-global', period] as const,
    /** Invalidate all global leaderboard infinite queries (any period). */
    globalAll: ['lb-global'] as const,
    friends: (userId: string, period: string) =>
      ['lb-friends', userId, period] as const,
    friendsAll: ['lb-friends'] as const,
  },
  search: {
    users: (q: string, uid: string) => ['search-users', q, uid] as const,
  },
} as const;

// -- Invalidation presets ------------------------------------------------------

/** Shared invalidations after any quest completion is created. */
export function invalidateCompletionRelated(queryClient: QueryClient, userId?: string) {
  void queryClient.invalidateQueries({ queryKey: qk.feed.all });
  void queryClient.invalidateQueries({ queryKey: qk.feed.groupAll });
  void queryClient.invalidateQueries({ queryKey: qk.groups.lbAll });
  void queryClient.invalidateQueries({ queryKey: qk.leaderboard.globalAll });
  void queryClient.invalidateQueries({ queryKey: qk.leaderboard.friendsAll });
  void queryClient.invalidateQueries({ queryKey: qk.challenges.lbAll });
  void queryClient.invalidateQueries({ queryKey: qk.quests.officialCountAll });
  void queryClient.invalidateQueries({ queryKey: qk.quests.lifeCompletionCountsAll });
  if (userId) {
    void queryClient.invalidateQueries({ queryKey: qk.profile.stats(userId) });
    void queryClient.invalidateQueries({ queryKey: qk.profile.recent(userId) });
    void queryClient.invalidateQueries({ queryKey: qk.profile.activity(userId) });
  }
}
