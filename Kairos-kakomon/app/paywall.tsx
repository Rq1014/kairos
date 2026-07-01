import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { DEMO_USER } from '@/mocks/data';
import { createOrder, confirmOrder, type PayChannelCode } from '@/api/billing';
import { getMe } from '@/api/user';
import { ApiError } from '@/api/client';

type Plan = 'ANNUAL' | 'MONTHLY';
type PurchaseState = 'idle' | 'processing' | 'success' | 'error';

const PRO_FEATURES = [
  { icon: 'graph',    label: '解锁全部研究科', desc: '不限 3 个研究科，所有过去问随便看' },
  { icon: 'layers',   label: '不限数量过去问', desc: '历年题库全开，不限最近 3 年' },
  { icon: 'zapOff',   label: '免广告解锁',     desc: '无需看广告即可查看与练习' },
  { icon: 'link',     label: '跨校相似题推荐', desc: '同专题跨校关联题，一键加固弱点' },
] as const;

const PLAN_INFO: Record<Plan, { label: string; price: string; unit: string; note: string; badge: string | null }> = {
  ANNUAL:  { label: '年度 Pro', price: '¥198', unit: '/年', note: '相当于 ¥16.5/月', badge: '最划算' },
  MONTHLY: { label: '月度 Pro', price: '¥28',  unit: '/月', note: '随时取消',         badge: null },
};

const CHANNELS: { code: PayChannelCode; label: string; icon: string }[] = [
  { code: 'WECHAT', label: '微信支付', icon: 'crown' },
  { code: 'ALIPAY', label: '支付宝',   icon: 'crown' },
  { code: 'APPLE',  label: 'Apple',    icon: 'crown' },
];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: c.background },
  successBg:   { alignItems: 'center', justifyContent: 'center' },
  successCard: { alignItems: 'center', gap: 16, padding: 32 },
  successIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.green50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: Typography['2xl'], fontWeight: Typography.weightBold, color: c.textPrimary },
  successSub:   { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', lineHeight: Typography.sm * 1.7 },

  header:   { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, alignItems: 'flex-end' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  hero:     { alignItems: 'center', paddingVertical: 20, gap: 8 },
  crownWrap:  { width: 64, height: 64, borderRadius: 20, backgroundColor: c.amber500 + '22', alignItems: 'center', justifyContent: 'center' },
  heroTitle:  { fontSize: Typography['2xl'], fontWeight: Typography.weightBold, color: c.textPrimary },
  heroSub:    { fontSize: Typography.sm, color: c.textMuted },
  features:   { paddingHorizontal: Spacing.screenPadding, gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: c.amber500 + '22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureMeta: { flex: 1, gap: 2 },
  featureLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  featureDesc:  { fontSize: Typography.xs, color: c.textMuted },

  plans:    { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.screenPadding, marginBottom: 14 },
  planCard: { flex: 1, borderRadius: Spacing.cardRadius, borderWidth: 1.5, borderColor: c.border, padding: Spacing.cardPadding, alignItems: 'center', gap: 4, backgroundColor: c.surface },
  planCardSelected: { borderColor: c.amber500, backgroundColor: c.amber500 + '0D' },
  planBadge:     { backgroundColor: c.amber500, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginBottom: 2 },
  planBadgeText: { fontSize: 10, fontWeight: Typography.weightBold, color: '#fff' },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  radioSelected: { borderColor: c.amber500 },
  radioDot:      { width: 9, height: 9, borderRadius: 4.5, backgroundColor: c.amber500 },
  planName:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  planNameSel:  { color: c.textPrimary },
  planPrice:    { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: c.textMuted },
  planPriceSel: { color: c.amber500 },
  planUnit:     { fontSize: Typography.sm, fontWeight: Typography.weightRegular },
  planNote:     { fontSize: Typography.xs, color: c.textMuted },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.screenPadding, marginBottom: 10, backgroundColor: c.rose50, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  errorText:   { flex: 1, fontSize: Typography.xs, color: c.rose500 },
  errorRetry:  { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.rose600 },

  subscribeBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: Spacing.screenPadding, backgroundColor: c.amber500, borderRadius: 14, paddingVertical: 14, minHeight: 50 },
  subscribeBtnLoading: { opacity: 0.7 },
  subscribeBtnText:    { fontSize: Typography.base, fontWeight: Typography.weightBold, color: '#fff' },
  channels:        { paddingHorizontal: Spacing.screenPadding, gap: 8, marginBottom: 14 },
  channelRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: c.surface },
  channelRowSelected: { borderColor: c.amber500, backgroundColor: c.amber500 + '0D' },
  channelLabel:    { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  channelLabelSel: { color: c.textPrimary },
  legal: { fontSize: Typography.xs, color: c.textMuted, textAlign: 'center', marginTop: 12, paddingHorizontal: Spacing.screenPadding },
});

export default function PaywallScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const setUser = useAuthStore((s) => s.setUser);
  const authToken = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('ANNUAL');
  const [selectedChannel, setSelectedChannel] = useState<PayChannelCode>('WECHAT');
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');

  async function handleSubscribe() {
    if (purchaseState === 'processing') return;
    setPurchaseState('processing');
    try {
      // 第一步：下单（拿到伪支付参数）
      const order = await createOrder(selectedPlan, selectedChannel);
      // 模拟用户在第三方完成支付：直接确认（真实接入时这里换成等待支付回调）
      await confirmOrder(order.orderNo);
      // 以后端为准刷新用户，更新 isPro
      const me = await getMe();
      setUser(me, authToken, refreshToken);
      setPurchaseState('success');
      setTimeout(() => router.back(), 1800);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '支付失败，请稍后重试';
      console.warn('[paywall] purchase failed:', msg);
      setPurchaseState('error');
    }
  }

  if (purchaseState === 'success') {
    return (
      <SafeAreaView style={[styles.container, styles.successBg]}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <Icon name="checkCircle" size={40} color={Colors.green600} />
          </View>
          <Text style={styles.successTitle}>订阅成功！</Text>
          <Text style={styles.successSub}>Pro 权益已激活{'\n'}返回即可使用全部功能</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Icon name="close" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.crownWrap}>
          <Icon name="crown" size={32} color={Colors.amber500} />
        </View>
        <Text style={styles.heroTitle}>解锁 Kakomon Pro</Text>
        <Text style={styles.heroSub}>全部学校 · 不限过去问 · 免广告</Text>
      </View>

      <View style={styles.features}>
        {PRO_FEATURES.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Icon name={f.icon as any} size={16} color={Colors.amber500} />
            </View>
            <View style={styles.featureMeta}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        {(['ANNUAL', 'MONTHLY'] as Plan[]).map((p) => {
          const info = PLAN_INFO[p];
          const selected = selectedPlan === p;
          return (
            <Pressable
              key={p}
              style={[styles.planCard, selected && styles.planCardSelected]}
              onPress={() => setSelectedPlan(p)}
            >
              {info.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{info.badge}</Text>
                </View>
              )}
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.planName, selected && styles.planNameSel]}>{info.label}</Text>
              <Text style={[styles.planPrice, selected && styles.planPriceSel]}>
                {info.price}<Text style={styles.planUnit}>{info.unit}</Text>
              </Text>
              <Text style={styles.planNote}>{info.note}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.channels}>
        {CHANNELS.map((ch) => {
          const selected = selectedChannel === ch.code;
          return (
            <Pressable
              key={ch.code}
              style={[styles.channelRow, selected && styles.channelRowSelected]}
              onPress={() => setSelectedChannel(ch.code)}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.channelLabel, selected && styles.channelLabelSel]}>{ch.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {purchaseState === 'error' && (
        <View style={styles.errorBanner}>
          <Icon name="xCircle" size={14} color={Colors.rose500} />
          <Text style={styles.errorText}>支付失败，请稍后重试</Text>
          <Pressable onPress={() => setPurchaseState('idle')}>
            <Text style={styles.errorRetry}>重试</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[styles.subscribeBtn, purchaseState === 'processing' && styles.subscribeBtnLoading]}
        onPress={handleSubscribe}
        disabled={purchaseState === 'processing'}
      >
        {purchaseState === 'processing' ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Icon name="crown" size={16} color="#fff" />
            <Text style={styles.subscribeBtnText}>
              {selectedPlan === 'ANNUAL' ? '立即订阅年度 Pro' : '立即订阅月度 Pro'}
            </Text>
          </>
        )}
      </Pressable>

      <Text style={styles.legal}>订阅自动续费 · 可随时在 App Store 取消 · 升级即时生效</Text>
    </SafeAreaView>
  );
}
