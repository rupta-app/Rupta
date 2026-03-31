/** Aura Level: level 2 at 1000, each step adds 1000 * 1.2^(n-2) */

export function auraThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 2; n <= level; n++) {
    total += Math.round(1000 * Math.pow(1.2, n - 2));
  }
  return total;
}

export function auraLevelFromTotal(totalAura: number): number {
  let level = 1;
  while (auraThresholdForLevel(level + 1) <= totalAura) {
    level++;
  }
  return level;
}

export function auraProgressInCurrentLevel(totalAura: number): {
  level: number;
  currentStart: number;
  nextThreshold: number;
  progress: number;
} {
  const level = auraLevelFromTotal(totalAura);
  const currentStart = auraThresholdForLevel(level);
  const nextThreshold = auraThresholdForLevel(level + 1);
  const span = nextThreshold - currentStart;
  const progress = span > 0 ? (totalAura - currentStart) / span : 1;
  return {
    level,
    currentStart,
    nextThreshold,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

export function auraToNextLevel(totalAura: number): number {
  const { nextThreshold } = auraProgressInCurrentLevel(totalAura);
  return Math.max(0, nextThreshold - totalAura);
}
