/** Design tokens — mirror tailwind.config.js */
export const colors = {
  background: '#0C0C10',
  surface: '#16161D',
  surfaceElevated: '#1E1E28',
  primary: '#8B6CFF',
  primaryLight: '#A78BFA',
  secondary: '#2DD4A0',
  respect: '#FF3040',
  danger: '#EF4444',
  dangerLight: '#F87171',
  border: '#232330',
  muted: '#9898A6',
  mutedForeground: '#5C5C6F',
  foreground: '#EDEDF0',
  white: '#FFFFFF',
  primaryGlow: 'rgba(139,108,255,0.12)',
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
