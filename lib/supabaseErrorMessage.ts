/** Normalizes Supabase / PostgREST / storage errors for UI. */
export function supabaseErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
