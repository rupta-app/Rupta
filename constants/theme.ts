/** Design tokens — mirror tailwind.config.js */
export const colors = {
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceElevated: '#1E1E2E',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  secondary: '#06D6A0',
  respect: '#F59E0B',
  danger: '#EF4444',
  dangerLight: '#F87171',
  border: '#2E2E3E',
  muted: '#94A3B8',
  mutedForeground: '#64748B',
  slate: '#CBD5E1',
  foreground: '#F8FAFC',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
