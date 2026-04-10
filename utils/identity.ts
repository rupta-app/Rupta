/** Case-insensitive comparison of two user IDs (handles null/undefined). */
export function isSameUser(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}
