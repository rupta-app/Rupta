import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Normalize Supabase foreign-key joins that return arrays to single objects. */
export function normalizeJoin<T>(val: T | T[]): T | null {
  return Array.isArray(val) ? val[0] ?? null : val;
}
