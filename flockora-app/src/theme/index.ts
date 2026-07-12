import { Platform } from 'react-native';

export const colors = {
  leafGreen: '#2F7D4A',
  sunflowerYellow: '#F6C445',
  softGreen: '#EAF5E7',
  warmCream: '#FFF9EC',
  hatchOrange: '#F29F3D',
  alertCoral: '#E85D4A',
  waterBlue: '#7BB6C7',
  primaryText: '#213026',
  secondaryText: '#5C6B5E',
  mutedText: '#7B8A7F',
  cardSurface: '#FFFFFF',
  border: '#DDE7DA',
  disabled: '#C8D4C5',
  background: '#FCF8F0',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const shadows = {
  card: {
    shadowColor: '#1A2A1F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
};

export const typography = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800' as const,
    fontFamily: 'Nunito_800ExtraBold',
  },
  screenTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
    fontFamily: 'Nunito_600SemiBold',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    fontFamily: 'Nunito_600SemiBold',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  typography,
};

export type AppTheme = typeof theme;
