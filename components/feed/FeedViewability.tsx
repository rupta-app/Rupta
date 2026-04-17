import { createContext, useContext } from 'react';

/**
 * Set of currently-visible feed post IDs. `null` means no provider is present
 * (e.g. group feed) — consumers default to active so videos still autoplay.
 */
const FeedViewabilityContext = createContext<Set<string> | null>(null);

export const FeedViewabilityProvider = FeedViewabilityContext.Provider;

export function useIsFeedVideoActive(postId: string | undefined): boolean {
  const visible = useContext(FeedViewabilityContext);
  if (!visible) return true;
  if (!postId) return false;
  return visible.has(postId);
}
