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

export const layout = {
  /** Standard horizontal padding for screen content */
  screenPadding: 16,
  /** Bottom padding for scrollable content on tab screens (clears tab bar) */
  tabScrollPadding: 120,
  /** Bottom padding for scrollable content on stack screens (clears home indicator) */
  scrollPadding: 48,
} as const;

export const typography = {
  hero: { fontSize: 36, lineHeight: 44, fontWeight: '700' as const },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  subtitle: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;
