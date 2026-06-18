import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface SegmentItem {
  value: string;
  label: string;
}

interface SegmentedProps {
  items: (string | SegmentItem)[];
  value: string;
  onChange: (value: string) => void;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: c.surfaceAlt,
    borderRadius: 9,
    padding: 3,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2'],
    paddingHorizontal: Spacing['3'],
    borderRadius: 7,
  },
  itemActive: {
    backgroundColor: c.surface,
  },
  text: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightMedium,
    color: c.textSecondary,
  },
  textActive: {
    color: c.textPrimary,
    fontWeight: Typography.weightSemibold,
  },
});

export function Segmented({ items, value, onChange }: SegmentedProps) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const v = typeof item === 'string' ? item : item.value;
        const label = typeof item === 'string' ? item : item.label;
        const active = value === v;
        return (
          <Pressable
            key={v}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onChange(v)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
