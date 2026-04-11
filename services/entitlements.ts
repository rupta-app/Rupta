import type { UserPlan } from '@/types/database';

export type { UserPlan };

export const PLAN_LIMITS = {
  free: { maxGroupsCreated: 2, maxGroupsJoined: 3, maxActiveChallengesPerGroup: 1 },
  pro: {
    maxGroupsCreated: Number.POSITIVE_INFINITY,
    maxGroupsJoined: Number.POSITIVE_INFINITY,
    maxActiveChallengesPerGroup: Number.POSITIVE_INFINITY,
  },
} as const;

export function getUserPlan(profile: { plan?: string | null } | null | undefined): UserPlan {
  if (profile?.plan === 'pro') return 'pro';
  return 'free';
}

export function canCreateGroup(plan: UserPlan, groupsOwnedCount: number): boolean {
  return groupsOwnedCount < PLAN_LIMITS[plan].maxGroupsCreated;
}

export function canCreateChallenge(plan: UserPlan, activeChallengesInGroup: number): boolean {
  return activeChallengesInGroup < PLAN_LIMITS[plan].maxActiveChallengesPerGroup;
}
