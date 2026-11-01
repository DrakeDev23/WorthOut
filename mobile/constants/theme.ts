import type { TextStyle, ViewStyle } from 'react-native';


export const colors = {
  background: '#0A0C10',
  surface: '#12161C',
  surfaceRaised: '#1A1F27',
  border: '#262D38',
  borderStrong: '#3A4351',

  text: '#F4F6F8',
  textMuted: '#A8B1BF',
  textSubtle: '#7C8696',

  primary: '#BFF800',
  primaryPressed: '#A9DE00',
  primarySoft: 'rgba(191, 248, 0, 0.12)',
  onPrimary: '#0A0C10',
  accent: '#FF7A59',

  danger: '#FF6B7A',
  dangerSoft: 'rgba(255, 107, 122, 0.12)',
  success: '#3DDC97',
  successSoft: 'rgba(61, 220, 151, 0.12)',
  info: '#5BC0FF',
  infoSoft: 'rgba(91, 192, 255, 0.12)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1.2 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0.1 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: 0.2 },
} as const satisfies Record<string, TextStyle>;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  maxContentWidth: 480,
  screenPaddingX: spacing.xl,
  minTouchTarget: 48,
  controlHeight: 56,
} as const;

export const motion = {
  fast: 140,
  base: 280,
  slow: 520,
} as const;
