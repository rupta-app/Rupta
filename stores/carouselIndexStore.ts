import { create } from 'zustand';

type CarouselIndexState = {
  indices: Record<string, number>;
};

/**
 * Per-post carousel slide index so the feed and detail view stay in sync when
 * the user moves between them.
 */
const useStore = create<CarouselIndexState>(() => ({ indices: {} }));

export function getCarouselIndex(postId: string): number {
  return useStore.getState().indices[postId] ?? 0;
}

export function setCarouselIndex(postId: string, index: number): void {
  if (!Number.isFinite(index) || index < 0) return;
  useStore.setState((s) => ({ indices: { ...s.indices, [postId]: index } }));
}

export function useCarouselIndex(postId: string): number {
  return useStore((s) => s.indices[postId] ?? 0);
}
