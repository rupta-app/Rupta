/** Spontaneous posts earn AURA only after reviewers set aura_earned (e.g. when promoted). */
export function isSpontaneousAuraPending(
  questSourceType: string | undefined | null,
  auraEarned: number,
): boolean {
  return questSourceType === 'spontaneous' && auraEarned === 0;
}
