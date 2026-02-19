/**
 * Inter font family names used in the app.
 *
 * These correspond to *local* .ttf files you place under:
 *   assets/Inter/static/
 *
 * Expected files (copy from the official Inter zip):
 *   - assets/Inter/static/Inter_24pt-Regular.ttf
 *   - assets/Inter/static/Inter_24pt-Medium.ttf
 *   - assets/Inter/static/Inter_24pt-SemiBold.ttf
 *   - assets/Inter/static/Inter_24pt-Bold.ttf
 */
export const FontFamily = {
  /** Body text, captions, labels */
  regular: 'Inter24Regular',
  /** Titles, section labels, buttons */
  medium: 'Inter24Medium',
  /** Headings, card titles, nav */
  semibold: 'Inter24SemiBold',
  /** Strong emphasis, hero text */
  bold: 'Inter24Bold',
} as const;
