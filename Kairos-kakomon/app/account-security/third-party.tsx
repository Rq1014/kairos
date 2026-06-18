import { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import type { IdentityType } from '@/types/user';

interface ProviderRow {
  type: Extract<IdentityType, 'WECHAT' | 'APPLE' | 'LINE'>;
  label: string;
  description: string;
}

const PROVIDERS: ProviderRow[] = [
  { type: 'WECHAT', label: '微信', description: '使用微信账号登录与绑定' },
  { type: 'APPLE', label: 'Apple', description: '使用 Apple ID 登录与绑定' },
  { type: 'LINE', label: 'LINE', description: '使用 LINE 账号登录与绑定' },
];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary,
  },

  scroll: { padding: Spacing.screenPadding, gap: 12 },

  card: {
    backgroundColor: c.surface,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    opacity: 0.7,
  },
  rowDivider: { height: 1, backgroundColor: c.border, marginLeft: Spacing.md },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  rowDesc: { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  rowValue: { fontSize: Typography.sm, color: c.textMuted, marginRight: 6 },

  hint: {
    fontSize: Typography.xs,
    color: c.textMuted,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
});

export default function ThirdPartyAccountsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>第三方账号</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {PROVIDERS.map((p, idx) => (
            <View key={p.type}>
              {idx > 0 && <View style={styles.rowDivider} />}
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowLabel}>{p.label}</Text>
                  <Text style={styles.rowDesc}>{p.description}</Text>
                </View>
                <Text style={styles.rowValue}>敬请期待</Text>
                <Icon name="lock" size={14} color={Colors.textMuted} />
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.hint}>第三方账号绑定功能仍在开发中，正式上线后可在此页面绑定与解绑。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
