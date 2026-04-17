import { Image, type ImageLoadEventData } from 'expo-image';
import { VideoView } from 'expo-video';
import { FastForward, Play, Rewind, Volume2, VolumeX } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/constants/theme';
import { useSharedVideoPlayer } from '@/hooks/useSharedVideoPlayer';
import { isVideoMedia } from '@/lib/mediaLimits';
import { getCarouselIndex, setCarouselIndex } from '@/stores/carouselIndexStore';
import { useVideoMuteStore } from '@/stores/videoMuteStore';

type MediaItem = {
  media_url: string;
  media_type?: string | null;
};

type Props = {
  items: MediaItem[];
  /** Completion/post id used to sync the slide index with the feed. */
  postId: string;
  /** Called when a photo finishes loading so the parent can tune aspect ratio. */
  onPhotoLoad?: (event: ImageLoadEventData) => void;
  /** Aspect ratio for the viewport; defaults to the feed's 5/4. */
  aspectRatio?: number;
};

const SEEK_STEP_S = 10;
const DOUBLE_TAP_MS = 280;

const VideoSlide = memo(function VideoSlide({
  uri,
  width,
  height,
  isActive,
}: {
  uri: string;
  width: number;
  height: number;
  isActive: boolean;
}) {
  const muted = useVideoMuteStore((s) => s.muted);
  const toggleMute = useVideoMuteStore((s) => s.toggle);
  const player = useSharedVideoPlayer(uri, isActive);
  const [seekDir, setSeekDir] = useState<'back' | 'forward' | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    try {
      return player.playing ?? false;
    } catch {
      return false;
    }
  });
  const seekAnim = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
  }, []);

  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying: next }) => {
      setIsPlaying(next);
    });
    try {
      setIsPlaying(player.playing ?? false);
    } catch {}
    return () => sub.remove();
  }, [player]);

  const flashSeek = (dir: 'back' | 'forward') => {
    setSeekDir(dir);
    seekAnim.setValue(0);
    Animated.sequence([
      Animated.timing(seekAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(seekAnim, { toValue: 0, duration: 420, delay: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setSeekDir(null);
    });
  };

  const onTap = (e: GestureResponderEvent) => {
    const now = Date.now();
    const x = e.nativeEvent.locationX;
    const deltaMs = now - lastTap.current.time;

    if (deltaMs < DOUBLE_TAP_MS) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      const dir: 'back' | 'forward' = x > width / 2 ? 'forward' : 'back';
      try {
        const current = player.currentTime ?? 0;
        const duration = player.duration ?? current + SEEK_STEP_S;
        const target =
          dir === 'forward'
            ? Math.min(duration, current + SEEK_STEP_S)
            : Math.max(0, current - SEEK_STEP_S);
        player.currentTime = target;
      } catch {}
      flashSeek(dir);
      lastTap.current = { time: 0, x: 0 };
      return;
    }

    lastTap.current = { time: now, x };
    singleTapTimer.current = setTimeout(() => {
      try {
        if (player.playing) player.pause();
        else player.play();
      } catch {}
      singleTapTimer.current = null;
    }, DOUBLE_TAP_MS);
  };

  return (
    <Pressable onPress={onTap} style={{ width, height, backgroundColor: '#000' }}>
      <VideoView
        pointerEvents="none"
        player={player}
        style={{ width, height }}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
      />

      {seekDir ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: seekDir === 'back' ? 0 : width / 2,
            width: width / 2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: seekAnim,
          }}
        >
          <View className="flex-row items-center gap-1.5 bg-black/60 rounded-full px-3 py-2">
            {seekDir === 'forward' ? (
              <FastForward color="#fff" size={18} fill="#fff" />
            ) : (
              <Rewind color="#fff" size={18} fill="#fff" />
            )}
            <Text className="text-white text-xs font-bold">{SEEK_STEP_S}s</Text>
          </View>
        </Animated.View>
      ) : null}

      {isActive && !isPlaying ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View className="bg-black/60 rounded-full p-5">
            <Play color="#fff" size={44} fill="#fff" />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={toggleMute}
        hitSlop={10}
        className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2"
      >
        {muted ? <VolumeX color="#fff" size={18} /> : <Volume2 color="#fff" size={18} />}
      </Pressable>
    </Pressable>
  );
});

export function CompletionMediaCarousel({ items, postId, onPhotoLoad, aspectRatio = 5 / 4 }: Props) {
  const { width } = useWindowDimensions();
  const height = width / aspectRatio;
  const [index, setIndex] = useState(() => {
    const stored = getCarouselIndex(postId);
    return Math.min(stored, Math.max(0, items.length - 1));
  });

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex(i);
      setCarouselIndex(postId, i);
    },
    [width, postId],
  );

  if (items.length === 0) return null;

  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.media_url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_data, i) => ({ length: width, offset: width * i, index: i })}
        initialScrollIndex={index > 0 ? index : undefined}
        renderItem={({ item, index: i }) =>
          isVideoMedia(item.media_url, item.media_type) ? (
            <VideoSlide
              uri={item.media_url}
              width={width}
              height={height}
              isActive={i === index}
            />
          ) : (
            <Image
              source={{ uri: item.media_url }}
              style={{ width, height, backgroundColor: colors.surfaceElevated }}
              contentFit="cover"
              onLoad={i === 0 ? onPhotoLoad : undefined}
              transition={{ effect: 'cross-dissolve', duration: 200 }}
            />
          )
        }
      />
      {items.length > 1 ? (
        <View className="flex-row justify-center gap-1.5 mt-2">
          {items.map((item, i) => (
            <View
              key={`${item.media_url}-dot-${i}`}
              className="rounded-full"
              style={{
                width: i === index ? 8 : 6,
                height: i === index ? 8 : 6,
                backgroundColor: i === index ? colors.primary : colors.surfaceElevated,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
