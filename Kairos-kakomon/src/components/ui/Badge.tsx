import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from './Icon';

type BadgeVariant = 'pro' | 'free' | 'preparing' | 'passed' | 'verified' | 'exact' | 'point' | 'method';

interface BadgeProps {
  variant: BadgeVariant;
}

function buildConfig(c: ThemeColors, isDark: boolean): Record<BadgeVariant, { label: string; bg: string; text: string; icon?: 'crown' }> {
  return {
    pro:       { label: 'PRO',      bg: c.amber500,  text: '#fff', icon: 'crown' },
    free:      { label: 'FREE',     bg: isDark ? c.slate600 : c.slate200, text: isDark ? c.slate300 : c.slate600 },
    preparing: { label: '备考中',   bg: c.blue500,   text: '#fff' },
    passed:    { label: '已合格',   bg: c.green500,  text: '#fff' },
    verified:  { label: '运营验证', bg: c.teal500,   text: '#fff' },
    exact:     { label: '完全同题', bg: c.blue500,   text: '#fff' },
    point:     { label: '同考点',   bg: c.indigo500, text: '#fff' },
    method:    { label: '相似解法', bg: c.teal500,   text: '#fff' },
  };
}

export function Badge({ variant }: BadgeProps) {
  const Colors = useColors();
  const isDark = useThemeStore((s) => s.mode) !== 'light';
  const config = useMemo(() => buildConfig(Colors, isDark), [Colors, isDark]);
  const cfg = config[variant];
  return (
    <View style={[styles.base, { backgroundColor: cfg.bg }]}>
      {cfg.icon && <Icon name={cfg.icon} size={10} color={cfg.text} />}
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing['2'],
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: Typography.weightSemibold,
    letterSpacing: 0.3,
  },
});
