import { create } from 'zustand';

type VideoPositionState = {
  positions: Record<string, number>;
};

/**
 * Per-URI playback position so the same video continues where it was when the
 * user moves between feed and detail views. Accessed imperatively to avoid
 * re-rendering every video whenever any position changes.
 */
const store = create<VideoPositionState>(() => ({ positions: {} }));

export function getVideoPosition(uri: string): number {
  return store.getState().positions[uri] ?? 0;
}

export function setVideoPosition(uri: string, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  store.setState((s) => ({ positions: { ...s.positions, [uri]: seconds } }));
}
