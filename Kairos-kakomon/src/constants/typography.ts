import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  default: 'sans-serif',
});

export const Typography = {
  fontFamily,

  // Size scale
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 34,

  // Weight (iOS system font supports these numeric weights)
  weightRegular:  '400' as const,
  weightMedium:   '500' as const,
  weightSemibold: '600' as const,
  weightBold:     '700' as const,

  // Line heights
  lineHeightTight:  1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
} as const;
