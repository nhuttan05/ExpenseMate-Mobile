import { createTamagui } from '@tamagui/core';

export const tamaguiConfig = createTamagui({
  themes: {
    light: {
      background: '#FAF8FF',
      color: '#131B2E',
      primary: '#4F46E5',
      secondary: '#006C49',
      error: '#BA1A1A',
    },
    dark: {
      background: '#131B2E',
      color: '#FAF8FF',
      primary: '#6366F1',
      secondary: '#10B981',
      error: '#EF4444',
    },
  },
  tokens: {
    color: {
      primary: '#4F46E5',
      secondary: '#006C49',
      error: '#BA1A1A',
      background: '#FAF8FF',
      surface: '#FFFFFF',
    },
    size: {
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    space: {
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    zIndex: {
      0: 0,
      1: 100,
    },
  },
  shorthands: {},
});

export type Conf = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
