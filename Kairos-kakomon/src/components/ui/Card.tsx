import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useColors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: keyof typeof Spacing | false;
  surface?: 'default' | 'alt';
}

export function Card({ children, style, onPress, padding = 'cardPadding', surface = 'default' }: CardProps) {
  const Colors = useColors();
  const bg = surface === 'alt' ? Colors.surfaceAlt : Colors.surface;
  const paddingValue = padding !== false ? Spacing[padding] : 0;

  const containerStyle: ViewStyle = {
    backgroundColor: bg,
    borderRadius: Spacing.cardRadius,
    padding: paddingValue,
  };

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [containerStyle, style, pressed && styles.pressed]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
});
