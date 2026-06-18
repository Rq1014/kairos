import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { DEMO_USER } from '@/mocks/data';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, ApiError } from '@/api/client';
import { deactivateAccount } from '@/api/auth';

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

  scroll: { padding: Spacing.screenPadding, gap: 0 },

  group: { marginBottom: Spacing.lg },
  groupCard: {
    backgroundColor: c.surface, borderRadius: Spacing.cardRadius,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 13,
  },
  rowPressed: { backgroundColor: c.surfaceAlt },
  rowDivider: { height: 1, backgroundColor: c.border, marginLeft: Spacing.md },
  rowLabel: { fontSize: Typography.sm, color: c.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end', marginLeft: 8 },
  rowValue: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'right', flex: 1 },
  badge: {
    fontSize: 10,
    fontWeight: Typography.weightSemibold,
    color: c.green500,
    backgroundColor: c.green500 + '1f',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },

  hint: {
    fontSize: Typography.xs,
    color: c.textMuted,
    paddingHorizontal: Spacing.md,
    marginTop: 6,
    lineHeight: 18,
  },

  dangerLabel: { color: c.rose500, fontWeight: Typography.weightSemibold },
  dangerHint: { color: c.textMuted },
});

export default function AccountSecurityScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [deactivating, setDeactivating] = useState(false);

  const realEmail = user.email && !user.email.endsWith('@phone.kakomon.local') ? user.email : '';
  const phone = user.phone ?? '';

  const performDeactivate = async () => {
    if (deactivating) return;
    setDeactivating(true);
    try {
      await deactivateAccount();
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
      ]);
      clearAuth();
      router.replace('/(auth)/login' as any);
      // 用 Alert 兜底替代 toast,统一文案
      setTimeout(() => Alert.alert('账号已注销'), 200);
    } catch (e: any) {
      const msg =
        e instanceof ApiError && e.message ? e.message : '网络异常，请稍后重试';
      Alert.alert('注销失败', msg);
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeactivatePress = () => {
    if (deactivating) return;
    Alert.alert(
      '注销账号',
      '注销账号则删除账号所有数据，是否继续注销',
      [
        { text: '取消', style: 'cancel' },
        { text: '继续注销', style: 'destructive', onPress: performDeactivate },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>账号安全</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          <View style={styles.groupCard}>
            <SecurityRow
              styles={styles}
              label="邮箱"
              value={realEmail || '未设置'}
              valueColor={realEmail ? undefined : Colors.amber500}
              bound={!!realEmail}
              onPress={() => router.push('/account-security/email' as any)}
            />
            <View style={styles.rowDivider} />
            <SecurityRow
              styles={styles}
              label="手机号"
              value={phone || '未设置'}
              valueColor={phone ? undefined : Colors.amber500}
              bound={!!phone}
              onPress={() => router.push('/account-security/phone' as any)}
            />
            <View style={styles.rowDivider} />
            <SecurityRow
              styles={styles}
              label="第三方账号"
              value="敬请期待"
              onPress={() => router.push('/account-security/third-party' as any)}
            />
            <View style={styles.rowDivider} />
            <SecurityRow
              styles={styles}
              label="登录密码"
              value={user.hasPassword ? '已设置' : '未设置'}
              valueColor={user.hasPassword ? undefined : Colors.amber500}
              onPress={() => router.push('/account-security/password' as any)}
            />
          </View>
          <Text style={styles.hint}>
            修改邮箱、手机号需通过验证码确认；修改登录密码会要求重新登录。
          </Text>
        </View>

        <View style={styles.group}>
          <View style={styles.groupCard}>
            <Pressable
              onPress={handleDeactivatePress}
              disabled={deactivating}
              style={({ pressed }) => [pressed && styles.rowPressed]}
            >
              <View style={styles.row}>
                <Text style={[styles.rowLabel, styles.dangerLabel]}>
                  {deactivating ? '正在注销…' : '注销账号'}
                </Text>
                <Icon name="chevronRight" size={14} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>
          <Text style={[styles.hint, styles.dangerHint]}>
            注销账号会清空所有学习数据，且无法恢复。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityRow({
  label,
  value,
  valueColor,
  bound,
  onPress,
  styles,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bound?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const Colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.rowPressed]}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>
          {bound ? <Text style={styles.badge}>已绑定</Text> : null}
          <Text style={[styles.rowValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={1}>
            {value}
          </Text>
          <Icon name="chevronRight" size={14} color={Colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}
