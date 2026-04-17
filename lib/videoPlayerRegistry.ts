import { createVideoPlayer, type VideoPlayer } from 'expo-video';

const MAX_CACHED_PLAYERS = 6;

type Entry = {
  player: VideoPlayer;
  refCount: number;
  lastAccessed: number;
  wants: Set<symbol>;
};

const registry = new Map<string, Entry>();

export function acquirePlayer(
  uri: string,
  opts: { initialMuted: boolean; initialTime: number },
): VideoPlayer {
  let entry = registry.get(uri);
  if (!entry) {
    const player = createVideoPlayer({ uri });
    player.loop = true;
    player.muted = opts.initialMuted;
    if (opts.initialTime > 0) {
      try {
        player.currentTime = opts.initialTime;
      } catch {}
    }
    entry = { player, refCount: 0, lastAccessed: Date.now(), wants: new Set() };
    registry.set(uri, entry);
  }
  entry.refCount += 1;
  entry.lastAccessed = Date.now();
  evictIfNeeded();
  return entry.player;
}

export function releasePlayer(uri: string): void {
  const entry = registry.get(uri);
  if (!entry) return;
  entry.refCount = Math.max(0, entry.refCount - 1);
  entry.lastAccessed = Date.now();
  evictIfNeeded();
}

export function setWantPlay(uri: string, token: symbol, wantPlay: boolean): void {
  const entry = registry.get(uri);
  if (!entry) return;
  if (wantPlay) entry.wants.add(token);
  else entry.wants.delete(token);
  try {
    if (entry.wants.size > 0) entry.player.play();
    else entry.player.pause();
  } catch {}
}

function evictIfNeeded(): void {
  const unused = [...registry.entries()]
    .filter(([, e]) => e.refCount === 0)
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  const active = registry.size - unused.length;
  const canKeep = Math.max(0, MAX_CACHED_PLAYERS - active);
  const toEvict = unused.slice(0, Math.max(0, unused.length - canKeep));
  for (const [uri, entry] of toEvict) {
    try {
      entry.player.release();
    } catch {}
    registry.delete(uri);
  }
}
