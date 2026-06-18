import { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Typography } from '@/constants/typography';

/**
 * 学校校徽。优先显示后端维护的 logoUrl 图片；
 * URL 缺失或加载失败时，回退到首字母色块（accent 背景）。
 *
 * 这样后端只要给 University.logoUrl 填上校徽地址即可，前端无需改动。
 */
export function SchoolLogo({
  logoUrl, short, accent, size = 32, radius = 8, textColor = '#fff', style,
}: {
  logoUrl?: string;
  /** 学校简称，用于回退首字母。 */
  short: string;
  /** 回退色块背景色。 */
  accent: string;
  size?: number;
  radius?: number;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size, borderRadius: radius } as const;

  if (logoUrl && !failed) {
    return (
      <View style={[styles.frame, dim, style]}>
        <Image
          source={{ uri: logoUrl }}
          style={[dim, { resizeMode: 'contain' }]}
          onError={() => setFailed(true)}
          accessibilityLabel={`${short} 校徽`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, dim, { backgroundColor: accent }, style]}>
      <Text style={[styles.letter, { fontSize: size * 0.42, color: textColor }]}>{short.slice(0, 1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#fff' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontWeight: Typography.weightBold },
});
