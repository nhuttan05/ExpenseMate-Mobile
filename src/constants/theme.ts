/**
 * Design Tokens for ExpenseMate Mobile App
 * Theme: Premium Modern Fintech (Human-Centered Design, Anti AI-Slop)
 * Palette follows 60-30-10 Golden Rule with WCAG 2.2 contrast compliance.
 */

export const Colors = {
  // Brand & Fintech Slate
  primary: '#006C49', // Forest Fintech Emerald
  primaryDark: '#004D34',
  primaryLight: '#E6F4EA',
  primaryAccent: '#059669', // Bright Emerald CTA

  navyDeep: '#0F172A', // Slate-900 (High contrast Net Worth cards)
  navySurface: '#1E293B', // Slate-800
  navyMuted: '#334155',

  // Status & Financial Indicators
  income: '#059669', // Emerald Green (Income / Positive)
  incomeLight: '#ECFDF5',
  expense: '#E11D48', // Rose Red (Expense / Outflow)
  expenseLight: '#FFE4E6',
  warning: '#D97706', // Amber (Budget alerts >80%)
  warningLight: '#FEF3C7',
  info: '#2563EB', // Royal Blue (Savings & Investments)
  infoLight: '#EFF6FF',
  purple: '#7C3AED', // Long-term Goals
  purpleLight: '#F3E8FF',
  teal: '#0D9488', // Give / Charity
  tealLight: '#F0FDFA',

  // Backward-compatibility aliases for existing components
  secondary: '#006C49',
  secondaryLight: '#E6F4EA',
  secondaryContainer: '#A7F3D0',
  error: '#E11D48',
  errorLight: '#FFE4E6',
  errorContainer: '#FEE2E2',

  // Surfaces & Backgrounds
  background: '#F8FAFC', // Slate-50 canvas
  surface: '#FFFFFF', // Pure porcelain card surface
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9', // Slate-100
  surfaceHighlight: '#E2E8F0',
  surfaceContainerLow: '#F8FAFC',
  surfaceContainer: '#F1F5F9',
  surfaceContainerHigh: '#E2E8F0',
  surfaceContainerHighest: '#CBD5E1',

  // Typography Colors
  textPrimary: '#0F172A', // Slate-900 (High contrast)
  textSecondary: '#475569', // Slate-600
  textMuted: '#94A3B8', // Slate-400
  textWhite: '#FFFFFF',
  primaryFixed: '#E6F4EA',
  onPrimaryFixed: '#004D34',

  // Borders & Dividers
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderEmerald: '#A7F3D0',
  outlineVariant: '#CBD5E1',
};

export const DarkColors = {
  // Brand & Fintech Slate
  primary: '#10B981', // Neon Emerald for Dark OLED
  primaryDark: '#059669',
  primaryLight: '#064E3B',
  primaryAccent: '#34D399',

  navyDeep: '#05080E',
  navySurface: '#0F172A',
  navyMuted: '#1E293B',

  // Status & Financial Indicators
  income: '#10B981',
  incomeLight: '#064E3B',
  expense: '#F43F5E',
  expenseLight: '#4C0519',
  warning: '#F59E0B',
  warningLight: '#451A03',
  info: '#38BDF8',
  infoLight: '#0C4A6E',
  purple: '#A855F7',
  purpleLight: '#3B0764',
  teal: '#14B8A6',
  tealLight: '#042F2E',

  secondary: '#10B981',
  secondaryLight: '#064E3B',
  secondaryContainer: '#047857',
  error: '#F43F5E',
  errorLight: '#4C0519',
  errorContainer: '#881337',

  // Surfaces & Backgrounds
  background: '#0B0F17', // OLED Pitch Black Canvas
  surface: '#151D2A', // Deep Slate Card Surface
  surfaceElevated: '#1E293B',
  surfaceSubtle: '#0F172A',
  surfaceHighlight: '#334155',
  surfaceContainerLow: '#0E1624',
  surfaceContainer: '#151D2A',
  surfaceContainerHigh: '#1E293B',
  surfaceContainerHighest: '#334155',

  // Typography Colors
  textPrimary: '#F8FAFC', // Pure White / Silver
  textSecondary: '#94A3B8', // Slate Light
  textMuted: '#64748B', // Muted Gray
  textWhite: '#FFFFFF',
  primaryFixed: '#064E3B',
  onPrimaryFixed: '#A7F3D0',

  // Borders & Dividers
  border: '#1E293B',
  borderSubtle: '#172033',
  borderEmerald: '#064E3B',
  outlineVariant: '#334155',
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
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  floating: {
    shadowColor: '#006C49',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  hero: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
};
