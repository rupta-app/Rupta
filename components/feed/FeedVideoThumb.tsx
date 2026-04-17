import { useIsFocused } from '@react-navigation/native';
import { VideoView } from 'expo-video';
import { Volume2, VolumeX } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { useSharedVideoPlayer } from '@/hooks/useSharedVideoPlayer';
import { useVideoMuteStore } from '@/stores/videoMuteStore';

import { useIsFeedVideoActive } from './FeedViewability';

/**
 * Feed video: autoplay + loop when visible AND the screen is focused. The
 * native player is shared with the detail carousel via the video player
 * registry so navigating to detail reuses the same download and resumes at the
 * same position.
 */
export const FeedVideoThumb = memo(function FeedVideoThumb({
  uri,
  postId,
  isCurrentSlide = true,
}: {
  uri: string;
  postId?: string;
  /** When in a multi-media carousel, whether this slide is the active one. */
  isCurrentSlide?: boolean;
}) {
  const muted = useVideoMuteStore((s) => s.muted);
  const toggleMuted = useVideoMuteStore((s) => s.toggle);
  const visible = useIsFeedVideoActive(postId);
  const focused = useIsFocused();
  const active = visible && focused && isCurrentSlide;
  const player = useSharedVideoPlayer(uri, active);

  return (
    <View pointerEvents="box-none" style={{ width: '100%', aspectRatio: 5 / 4, backgroundColor: '#000' }}>
      {focused ? (
        <VideoView
          pointerEvents="none"
          player={player}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={false}
        />
      ) : null}
      <Pressable
        onPress={toggleMuted}
        hitSlop={10}
        className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2"
      >
        {muted ? <VolumeX color="#fff" size={18} /> : <Volume2 color="#fff" size={18} />}
      </Pressable>
    </View>
  );
});
