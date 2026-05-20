export const Colors = {
  background: '#0a0a0a',
  card: 'rgba(20, 20, 40, 0.75)',
  cardSolid: '#0f0f1e',
  neonCyan: '#00f3ff',
  neonPink: '#ff00cc',
  neonGreen: '#4ade80',
  neonGreenDark: '#22c55e',
  textPrimary: '#e0e0e0',
  textSecondary: '#a0a0a0',
  textMuted: '#6b7280',
  borderDark: 'rgba(55, 65, 81, 0.3)',
  barTrack: '#1f2937',
  disabledBg: '#111827',
  
} as const;

export const Shadows = {
  neonCyan: {
    shadowColor: '#00f3ff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  neonPink: {
    shadowColor: '#ff00cc',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  neonCyanStrong: {
    shadowColor: '#00f3ff',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  neonGreen: {
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
} as const;

export const Borders = {
  neonCyan: { borderWidth: 0.5, borderColor: '#00f3ff' },
  neonCyanFaint: { borderWidth: 0.5, borderColor: 'rgba(0, 243, 255, 0.3)' },
  neonPink: { borderWidth: 0.5, borderColor: '#ff00cc' },
  neonGreen: { borderWidth: 0.5, borderColor: 'rgba(34, 197, 94, 0.5)' },
  disabled: { borderWidth: 0.5, borderColor: 'rgba(55, 65, 81, 0.3)' },
} as const;

export const FontFamilies = {
  bold: 'Rajdhani_700Bold',
  medium: 'Rajdhani_500Medium',
  light: 'Rajdhani_300Light',
  regular: 'Rajdhani_400Regular',
  semiBold: 'Rajdhani_600SemiBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
