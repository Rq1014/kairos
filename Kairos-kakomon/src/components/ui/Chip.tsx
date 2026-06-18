import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

type ChipColor = 'slate' | 'blue' | 'teal' | 'indigo' | 'amber' | 'green' | 'rose';

interface ChipProps {
  children: string;
  color?: ChipColor;
  selected?: boolean;
  outlined?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

type ChipStyle = { bg: string; selectedBg: string; text: string; selectedText: string; border: string };

// Dark mode: dark tinted bg + light text. Light mode: light tinted bg + dark text.
function buildColorMap(c: ThemeColors, isDark: boolean): Record<ChipColor, ChipStyle> {
  if (isDark) {
    return {
      slate:  { bg: c.slate700,  selectedBg: c.slate500,  text: c.slate300,  selectedText: c.slate50, border: c.slate500 },
      blue:   { bg: c.blue700,   selectedBg: c.blue500,   text: c.blue100,   selectedText: '#fff',    border: c.blue500 },
      teal:   { bg: c.teal600,   selectedBg: c.teal500,   text: c.teal100,   selectedText: '#fff',    border: c.teal500 },
      indigo: { bg: c.indigo600, selectedBg: c.indigo500, text: c.indigo50,  selectedText: '#fff',    border: c.indigo500 },
      amber:  { bg: c.amber600,  selectedBg: c.amber500,  text: c.amber50,   selectedText: '#fff',    border: c.amber500 },
      green:  { bg: c.green600,  selectedBg: c.green500,  text: c.green50,   selectedText: '#fff',    border: c.green500 },
      rose:   { bg: c.rose600,   selectedBg: c.rose500,   text: c.rose50,    selectedText: '#fff',    border: c.rose500 },
    };
  }
  return {
    slate:  { bg: c.slate100, selectedBg: c.slate600,  text: c.slate600,  selectedText: '#fff', border: c.slate300 },
    blue:   { bg: c.blue50,   selectedBg: c.blue500,   text: c.blue700,   selectedText: '#fff', border: c.blue500 },
    teal:   { bg: c.teal50,   selectedBg: c.teal500,   text: c.teal600,   selectedText: '#fff', border: c.teal500 },
    indigo: { bg: c.indigo50, selectedBg: c.indigo500, text: c.indigo600, selectedText: '#fff', border: c.indigo500 },
    amber:  { bg: c.amber50,  selectedBg: c.amber500,  text: c.amber600,  selectedText: '#fff', border: c.amber500 },
    green:  { bg: c.green50,  selectedBg: c.green500,  text: c.green600,  selectedText: '#fff', border: c.green500 },
    rose:   { bg: c.rose50,   selectedBg: c.rose500,   text: c.rose600,   selectedText: '#fff', border: c.rose500 },
  };
}

export function Chip({ children, color = 'slate', selected = false, outlined = false, size = 'md', onPress }: ChipProps) {
  const Colors = useColors();
  const isDark = useThemeStore((s) => s.mode) !== 'light';
  const colorMap = useMemo(() => buildColorMap(Colors, isDark), [Colors, isDark]);
  const c = colorMap[color];
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const containerStyle = [
    styles.base,
    isSmall && styles.sm,
    isLarge && styles.lg,
    outlined
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border }
      : { backgroundColor: selected ? c.selectedBg : c.bg },
  ];

  const textStyle = [
    styles.text,
    isSmall && styles.textSm,
    isLarge && styles.textLg,
    { color: outlined ? c.border : selected ? c.selectedText : c.text },
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
        onPress={onPress}
      >
        <Text style={textStyle}>{children}</Text>
      </Pressable>
    );
  }

  return (
    <Text style={[containerStyle, textStyle]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.chipRadius,
    paddingHorizontal: Spacing['3'],
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing['2'],
    paddingVertical: 3,
  },
  lg: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: 7,
  },
  text: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightMedium,
  },
  textSm: {
    fontSize: Typography.xs,
  },
  textLg: {
    fontSize: Typography.base,
  },
  pressed: {
    opacity: 0.75,
  },
});
