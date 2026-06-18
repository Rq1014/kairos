import { useMemo } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';

const PLAN_COMPARISON = [
  { feature: '可选研究科数', free: '3 个',          pro: '全部研究科' },
  { feature: '过去问年份',   free: '最近 3 年',     pro: '历年全开' },
  { feature: '看广告解锁',   free: '需要',          pro: '免广告' },
  { feature: '跨校相似题',   free: '看广告解锁',    pro: '✓' },
  { feature: 'PRO 专属徽章', free: '✕',            pro: '✓' },
  { feature: '贡献榜优先',   free: '✕',            pro: '✓' },
] as const;

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: c.background },
  scroll:      { padding: Spacing.screenPadding },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  headerBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  section:     { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  gap:          { marginBottom: Spacing.lg },

  planCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 12 },
  planRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.teal50, alignItems: 'center', justifyContent: 'center' },
  planMeta: { flex: 1, gap: 2 },
  planName: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  planDesc: { fontSize: Typography.xs, color: c.textMuted },
  freeBadge:     { backgroundColor: c.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  freeBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  quotaRow:   { gap: 4 },
  quotaTrack: { height: 6, backgroundColor: c.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  quotaFill:  { height: 6, backgroundColor: c.teal500, borderRadius: 3 },
  quotaLabel: { fontSize: Typography.xs, color: c.textMuted },

  upgradeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.amber500 + '11', borderRadius: Spacing.cardRadius, borderWidth: 1.5, borderColor: c.amber500 + '44', padding: Spacing.cardPadding },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeText: { gap: 2 },
  upgradeTitle: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  upgradeSub:   { fontSize: Typography.xs, color: c.textMuted },

  compCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  compHeader:  { flexDirection: 'row', paddingHorizontal: Spacing.cardPadding, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  compRow:     { flexDirection: 'row', paddingHorizontal: Spacing.cardPadding, paddingVertical: 10 },
  compRowAlt:  { backgroundColor: c.surfaceAlt + '33' },
  compCell:    { flex: 1 },
  compCellFeature: { flex: 2, fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  compCellLabel:   { textAlign: 'center', fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  compCellPro:     { textAlign: 'center', fontSize: Typography.xs, fontWeight: Typography.weightBold, color: c.amber500 },
  compFeature:     { flex: 2, fontSize: Typography.xs, color: c.textSecondary },
  compFree:        { textAlign: 'center', fontSize: Typography.xs, color: c.textMuted },
  compPro:         { textAlign: 'center', fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted },
  compProCheck:    { color: c.green600, fontSize: Typography.sm },

  actionsCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border },
  actionRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.cardPadding, paddingVertical: 14 },
  actionLabel: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },
  divider:     { height: 1, backgroundColor: c.border, marginHorizontal: Spacing.cardPadding },
});

export default function BillingScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>订阅与账单</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Current plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>当前套餐</Text>
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={styles.planIcon}>
                <Icon name="sparkles" size={20} color={Colors.teal500} />
              </View>
              <View style={styles.planMeta}>
                <Text style={styles.planName}>免费版</Text>
                <Text style={styles.planDesc}>3 个研究科 · 最近 3 年 · 看广告解锁更多</Text>
              </View>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>Free</Text>
              </View>
            </View>
            <View style={styles.quotaRow}>
              <View style={styles.quotaTrack}>
                <View style={[styles.quotaFill, { width: '67%' }]} />
              </View>
              <Text style={styles.quotaLabel}>今日 AI 已用 2 / 3 次</Text>
            </View>
          </View>
        </View>

        {/* Upgrade CTA */}
        <Pressable style={styles.upgradeCard} onPress={() => router.push('/paywall' as any)}>
          <View style={styles.upgradeLeft}>
            <Icon name="crown" size={18} color={Colors.amber500} />
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>升级 Pro，解锁全部权益</Text>
              <Text style={styles.upgradeSub}>年度 ¥198 · 月度 ¥28</Text>
            </View>
          </View>
          <Icon name="chevronRight" size={16} color={Colors.amber500} />
        </Pressable>

        <View style={styles.gap} />

        {/* Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能对比</Text>
          <View style={styles.compCard}>
            <View style={styles.compHeader}>
              <Text style={[styles.compCell, styles.compCellFeature]} />
              <Text style={[styles.compCell, styles.compCellLabel]}>免费版</Text>
              <Text style={[styles.compCell, styles.compCellPro]}>Pro</Text>
            </View>
            {PLAN_COMPARISON.map((row, i) => (
              <View key={row.feature} style={[styles.compRow, i % 2 === 0 && styles.compRowAlt]}>
                <Text style={[styles.compCell, styles.compFeature]}>{row.feature}</Text>
                <Text style={[styles.compCell, styles.compFree]}>{row.free}</Text>
                <Text style={[styles.compCell, styles.compPro, row.pro === '✓' && styles.compProCheck]}>
                  {row.pro}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户操作</Text>
          <View style={styles.actionsCard}>
            <Pressable
              style={styles.actionRow}
              onPress={() => Alert.alert('恢复购买', '未找到可恢复的购买记录。如有问题请联系支持。', [{ text: '确定' }])}
            >
              <Icon name="refresh" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>恢复购买</Text>
              <Icon name="chevronRight" size={14} color={Colors.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={styles.actionRow}
              onPress={() => Linking.openURL('mailto:support@kakomon.app')}
            >
              <Icon name="message" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>联系支持</Text>
              <Icon name="chevronRight" size={14} color={Colors.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={styles.actionRow}
              onPress={() => Linking.openURL('https://kakomon.app/privacy')}
            >
              <Icon name="info" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>隐私政策与服务条款</Text>
              <Icon name="chevronRight" size={14} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
