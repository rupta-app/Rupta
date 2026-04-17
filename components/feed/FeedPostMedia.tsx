import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';

import { colors } from '@/constants/theme';
import { isVideoMedia } from '@/lib/mediaLimits';
import { setCarouselIndex, useCarouselIndex } from '@/stores/carouselIndexStore';

import { FeedVideoThumb } from './FeedVideoThumb';

type MediaItem = { media_url: string; media_type?: 'photo' | 'video' };

const ASPECT = 5 / 4;

function SingleSlide({
  item,
  postId,
  width,
  height,
  isCurrentSlide,
  onTap,
}: {
  item: MediaItem;
  postId: string;
  width: number;
  height: number;
  isCurrentSlide: boolean;
  onTap?: () => void;
}) {
  const content = isVideoMedia(item.media_url, item.media_type) ? (
    <View style={{ width, height }}>
      <FeedVideoThumb uri={item.media_url} postId={postId} isCurrentSlide={isCurrentSlide} />
    </View>
  ) : (
    <Image
      source={{ uri: item.media_url }}
      style={{ width, height }}
      contentFit="cover"
      transition={{ effect: 'cross-dissolve', duration: 200 }}
    />
  );

  if (!onTap) return content;
  return (
    <Pressable onPress={onTap} style={{ width, height }}>
      {content}
    </Pressable>
  );
}

export const FeedPostMedia = memo(function FeedPostMedia({
  items,
  postId,
  onSlideTap,
}: {
  items: MediaItem[];
  postId: string;
  onSlideTap?: () => void;
}) {
  const [width, setWidth] = useState(0);
  const storedIndex = useCarouselIndex(postId);
  const index = Math.min(storedIndex, Math.max(0, items.length - 1));
  const listRef = useRef<FlatList<MediaItem>>(null);
  const lastScrolled = useRef<number>(index);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0) setWidth(w);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width === 0) return;
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      lastScrolled.current = i;
      setCarouselIndex(postId, i);
    },
    [width, postId],
  );

  useEffect(() => {
    if (width === 0) return;
    if (lastScrolled.current === index) return;
    lastScrolled.current = index;
    try {
      listRef.current?.scrollToIndex({ index, animated: false });
    } catch {}
  }, [index, width]);

  if (items.length === 0) return null;

  const height = width / ASPECT;

  if (items.length === 1) {
    return (
      <View onLayout={onLayout} style={{ width: '100%', aspectRatio: ASPECT }}>
        {width > 0 ? (
          <SingleSlide
            item={items[0]}
            postId={postId}
            width={width}
            height={height}
            isCurrentSlide
            onTap={onSlideTap}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={{ width: '100%', aspectRatio: ASPECT }}>
      {width > 0 ? (
        <>
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item, i) => `${item.media_url}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={(_data, i) => ({ length: width, offset: width * i, index: i })}
            initialScrollIndex={index > 0 ? index : undefined}
            renderItem={({ item, index: i }) => (
              <SingleSlide
                item={item}
                postId={postId}
                width={width}
                height={height}
                isCurrentSlide={i === index}
                onTap={onSlideTap}
              />
            )}
          />
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 bottom-2 flex-row justify-center gap-1.5"
          >
            {items.map((item, i) => (
              <View
                key={`${item.media_url}-dot-${i}`}
                className="rounded-full"
                style={{
                  width: i === index ? 7 : 5,
                  height: i === index ? 7 : 5,
                  backgroundColor: i === index ? colors.foreground : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
});
