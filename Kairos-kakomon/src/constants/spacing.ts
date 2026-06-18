export const Spacing = {
  '0':  0,
  '1':  4,
  '2':  8,
  '3':  12,
  '4':  16,
  '5':  20,
  '6':  24,
  '8':  32,
  '10': 40,
  '12': 48,
  '16': 64,

  // Semantic aliases
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  '2xl': 48,

  // Component-specific
  screenPadding:  16,
  cardPadding:    16,
  cardRadius:     12,
  chipRadius:     20,
  buttonRadius:   10,
  tabBarHeight:   83,  // iOS tab bar with safe area
} as const;
