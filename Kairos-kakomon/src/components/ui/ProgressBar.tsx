import { StyleSheet, View } from 'react-native';
import { useColors } from '@/constants/colors';

type ProgressColor = 'blue' | 'teal' | 'amber' | 'green' | 'rose' | 'indigo';

interface ProgressBarProps {
  value: number;
  height?: number;
  color?: ProgressColor;
  trackColor?: string;
  borderRadius?: number;
}

const COLOR_MAP: Record<ProgressColor, string> = {
  blue:   '#3b82f6',
  teal:   '#14b8a6',
  amber:  '#f59e0b',
  green:  '#22c55e',
  rose:   '#f43f5e',
  indigo: '#6366f1',
};

export function ProgressBar({
  value,
  height = 6,
  color = 'blue',
  trackColor,
  borderRadius,
}: ProgressBarProps) {
  const Colors = useColors();
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = borderRadius ?? height / 2;
  const track = trackColor ?? Colors.surfaceAlt;

  return (
    <View style={[styles.track, { height, backgroundColor: track, borderRadius: radius }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedValue}%`,
            backgroundColor: COLOR_MAP[color],
            borderRadius: radius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
