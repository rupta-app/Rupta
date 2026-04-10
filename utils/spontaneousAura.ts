/** Spontaneous posts earn AURA only after reviewers set aura_earned (e.g. when promoted). */
export function isSpontaneousAuraPending(
  questSourceType: string | undefined | null,
  auraEarned: number,
): boolean {
  return questSourceType === 'spontaneous' && auraEarned === 0;
}

/** Returns a formatted AURA string, showing a pending label for unreviewed spontaneous quests. */
export function formatAuraDisplay(
  sourceType: string | undefined | null,
  aura: number,
  pendingLabel: string,
): string {
  return isSpontaneousAuraPending(sourceType, aura) ? pendingLabel : `+${aura} AURA`;
}
