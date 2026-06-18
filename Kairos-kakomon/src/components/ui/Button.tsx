import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'pro';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
}: ButtonProps) {
  const Colors = useColors();

  const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary:   { bg: Colors.blue600,   text: '#fff' },
    secondary: { bg: Colors.surfaceAlt,  text: Colors.textPrimary, border: Colors.border },
    ghost:     { bg: 'transparent',    text: Colors.textSecondary },
    danger:    { bg: Colors.rose600,   text: '#fff' },
    pro:       { bg: Colors.amber500,  text: '#fff' },
  };

  const v = VARIANT_STYLES[variant];
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  const iconColor = v.text;
  const iconSize = isSmall ? 14 : isLarge ? 20 : 16;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isSmall && styles.sm,
        isLarge && styles.lg,
        fullWidth && styles.fullWidth,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {iconLeft && <Icon name={iconLeft} size={iconSize} color={iconColor} />}
          <Text style={[styles.text, isSmall && styles.textSm, isLarge && styles.textLg, { color: v.text }]}>
            {children}
          </Text>
          {iconRight && <Icon name={iconRight} size={iconSize} color={iconColor} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2'],
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    borderRadius: Spacing.buttonRadius,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['1'],
    borderRadius: 8,
  },
  lg: {
    paddingHorizontal: Spacing['6'],
    paddingVertical: Spacing['4'],
    borderRadius: 12,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    fontSize: Typography.base,
    fontWeight: Typography.weightSemibold,
  },
  textSm: {
    fontSize: Typography.sm,
  },
  textLg: {
    fontSize: Typography.md,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
