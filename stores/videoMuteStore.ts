import { create } from 'zustand';

type VideoMuteState = {
  muted: boolean;
  setMuted: (next: boolean) => void;
  toggle: () => void;
};

/**
 * Global mute preference shared between the feed thumbnail and the detail
 * player so unmuting in one place persists when the user navigates.
 * Defaults to muted because feed videos autoplay.
 */
export const useVideoMuteStore = create<VideoMuteState>((set) => ({
  muted: true,
  setMuted: (next) => set({ muted: next }),
  toggle: () => set((s) => ({ muted: !s.muted })),
}));
