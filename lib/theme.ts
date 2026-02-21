/**
 * Theme color definitions for dark and light modes.
 * Dark: current app scheme. Light: cream background, forest green, warm orange.
 */

export const DARK_COLORS = {
  background: '#1A1C19',
  backgroundSecondary: '#242922',
  card: '#242922',
  cardFill: '#242922',
  text: '#F5F5DC',
  textSecondary: 'rgba(245, 245, 220, 0.8)',
  textMuted: '#9CA3AF',
  green: '#4CAF50',
  greenMuted: 'rgba(76, 175, 80, 0.25)',
  greenBorder: 'rgba(76, 175, 80, 0.3)',
  orange: '#F39C12',
  orangeMuted: 'rgba(243, 156, 18, 0.25)',
  orangeBorder: 'rgba(243, 156, 18, 0.3)',
  border: '#242922',
  inputBg: '#1A1C19',
  inputBorder: '#242922',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  errorBorder: 'rgba(239, 68, 68, 0.4)',
  gradientStart: '#1A1C19',
  gradientEnd: '#242922',
  gradientMid: '#242922',
  onGreen: '#1A1C19',
  divider: '#1A1C19',
} as const;

export const LIGHT_COLORS = {
  background: '#F9F7F2',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardFill: '#FFFFFF',
  text: '#1A1C19',
  textSecondary: 'rgba(26, 28, 25, 0.85)',
  textMuted: '#6B7280',
  green: '#228B22',
  greenMuted: 'rgba(34, 139, 34, 0.15)',
  greenBorder: 'rgba(34, 139, 34, 0.4)',
  orange: '#E67E22',
  orangeMuted: 'rgba(230, 126, 34, 0.15)',
  orangeBorder: 'rgba(230, 126, 34, 0.4)',
  border: '#E5E5E0',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E5E0',
  error: '#DC2626',
  errorMuted: 'rgba(220, 38, 38, 0.15)',
  errorBorder: 'rgba(220, 38, 38, 0.4)',
  gradientStart: '#F9F7F2',
  gradientEnd: '#FFFFFF',
  gradientMid: '#FFFFFF',
  onGreen: '#FFFFFF',
  divider: '#E5E5E0',
} as const;

export type ThemeColors = typeof DARK_COLORS;
