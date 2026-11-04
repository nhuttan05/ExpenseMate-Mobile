/**
 * Design Tokens for ExpenseMate Mobile App
 * Extracted from Google Stitch Project: ExpenseMate Mobile App Design
 * Style: Modern Neo-Fintech Minimal
 */

export const Colors = {
  // Brand Colors
  primary: '#4F46E5', // Deep Indigo
  primaryDark: '#3525CD',
  primaryLight: '#EEF2FF',
  primaryFixed: '#E2DFFF',
  onPrimaryFixed: '#0F0069',

  // Status & Financial Indicators
  secondary: '#006C49', // Emerald Green (Income / Positive Flow)
  secondaryLight: '#E6F4EA',
  secondaryContainer: '#6CF8BB',
  
  error: '#BA1A1A', // Coral Red (Expense / Destructive)
  errorLight: '#FEE2E2',
  errorContainer: '#FFDAD6',

  // Surfaces & Backgrounds
  background: '#FAF8FF', // Soft canvas
  surface: '#FFFFFF', // Pure white card surface
  surfaceDim: '#D2D9F4',
  surfaceContainerLow: '#F2F3FF',
  surfaceContainer: '#EAEDFF',
  surfaceContainerHigh: '#E2E7FF',
  surfaceContainerHighest: '#DAE2FD',

  // Typography Colors
  textPrimary: '#131B2E', // High contrast slate/navy
  textSecondary: '#464555', // Slate secondary
  textMuted: '#777587',
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  outlineVariant: '#C7C4D8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
};
