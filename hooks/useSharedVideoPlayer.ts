import { useEffect, useRef } from 'react';
import type { VideoPlayer } from 'expo-video';

import { acquirePlayer, releasePlayer, setWantPlay } from '@/lib/videoPlayerRegistry';
import { useVideoMuteStore } from '@/stores/videoMuteStore';
import { getVideoPosition, setVideoPosition } from '@/stores/videoPositionStore';

const POSITION_SAVE_INTERVAL_MS = 400;

/**
 * Shares a single native VideoPlayer across components for the same URI, so
 * navigating between feed and detail doesn't re-download the video. Owns mute
 * sync, periodic position persistence, and coordinated play/pause via
 * wants-to-play tokens so multiple consumers don't fight over the same player.
 */
export function useSharedVideoPlayer(uri: string, wantPlay: boolean): VideoPlayer {
  const muted = useVideoMuteStore((s) => s.muted);
  const tokenRef = useRef<symbol>(Symbol('video-consumer'));
  const playerRef = useRef<VideoPlayer | null>(null);

  if (!playerRef.current) {
    playerRef.current = acquirePlayer(uri, {
      initialMuted: muted,
      initialTime: getVideoPosition(uri),
    });
  }

  useEffect(() => {
    const token = tokenRef.current;
    return () => {
      setWantPlay(uri, token, false);
      releasePlayer(uri);
      playerRef.current = null;
    };
  }, [uri]);

  useEffect(() => {
    setWantPlay(uri, tokenRef.current, wantPlay);
  }, [uri, wantPlay]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.muted = muted;
    } catch {}
  }, [muted]);

  useEffect(() => {
    if (!wantPlay) return;
    const p = playerRef.current;
    if (!p) return;
    const id = setInterval(() => {
      try {
        setVideoPosition(uri, p.currentTime ?? 0);
      } catch {}
    }, POSITION_SAVE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      try {
        setVideoPosition(uri, p.currentTime ?? 0);
      } catch {}
    };
  }, [uri, wantPlay]);

  return playerRef.current;
}
