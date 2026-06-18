import { useThemeStore } from '@/store/themeStore';

const ACCENT = {
  blue50:  '#eff6ff',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  teal50:  '#f0fdfa',
  teal100: '#ccfbf1',
  teal500: '#14b8a6',
  teal600: '#0d9488',

  indigo50:  '#eef2ff',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',

  amber50:  '#fffbeb',
  amber500: '#f59e0b',
  amber600: '#d97706',

  green50:  '#f0fdf4',
  green500: '#22c55e',
  green600: '#16a34a',

  rose50:  '#fff1f2',
  rose500: '#f43f5e',
  rose600: '#e11d48',

  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  proGradientStart: '#f59e0b',
  proGradientEnd:   '#f43f5e',
} as const;

const DARK_SEMANTIC = {
  background:    '#0f172a',
  surface:       '#1e293b',
  surfaceAlt:    '#334155',
  border:        '#334155',
  textPrimary:   '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted:     '#64748b',
} as const;

const LIGHT_SEMANTIC = {
  background:    '#f8fafc',
  surface:       '#ffffff',
  surfaceAlt:    '#f1f5f9',
  border:        '#e2e8f0',
  textPrimary:   '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',
} as const;

export const DARK_COLORS  = { ...ACCENT, ...DARK_SEMANTIC }  as const;
export const LIGHT_COLORS = { ...ACCENT, ...LIGHT_SEMANTIC } as const;

export type ThemeColors = { readonly [K in keyof typeof DARK_COLORS]: string };
export type ColorKey    = keyof ThemeColors;

/** Static fallback used outside React (module-level StyleSheet, etc.) */
export const Colors = DARK_COLORS;

/** Dynamic hook — use inside components. Returns the active palette. */
export function useColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
}
