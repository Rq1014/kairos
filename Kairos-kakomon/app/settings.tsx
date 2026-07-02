import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { DEMO_USER } from '@/mocks/data';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/client';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, paddingTop: 8, gap: 0 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  group: { marginBottom: Spacing.lg },
  groupTitle: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm },
  groupCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 13 },
  rowPressed: { backgroundColor: c.surfaceAlt },
  rowDivider: { height: 1, backgroundColor: c.border, marginLeft: Spacing.md },
  rowLabel: { fontSize: Typography.sm, color: c.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end', marginLeft: 8 },
  rowValue: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'right', flex: 1 },

  logoutSection: { marginTop: 8, marginBottom: Spacing.lg },
  logoutBtn: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.rose500 + '44', padding: Spacing.md, alignItems: 'center' },
  logoutText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.rose500 },
});

function SettingsGroup({ title, children, styles }: { title: string; children: React.ReactNode; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  label,
  value,
  valueColor,
  onPress,
  showArrow = true,
  styles,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  showArrow?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const Colors = useColors();
  const content = (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, valueColor ? { color: valueColor } : undefined]}>
            {value}
          </Text>
        )}
        {showArrow && <Icon name="chevronRight" size={14} color={Colors.textMuted} />}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.rowPressed]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

function SettingsToggle({ label, defaultOn, styles }: { label: string; defaultOn: boolean; styles: ReturnType<typeof makeStyles> }) {
  const [on, setOn] = useState(defaultOn);
  const Colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={on}
        onValueChange={setOn}
        trackColor={{ false: Colors.surfaceAlt, true: Colors.blue500 }}
        thumbColor="#fff"
      />
    </View>
  );
}

function ThemeToggleRow({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const { mode, toggle } = useThemeStore();
  const Colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>外观主题</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{mode === 'dark' ? '深色' : '浅色'}</Text>
        <Switch
          value={mode === 'light'}
          onValueChange={toggle}
          trackColor={{ false: Colors.surfaceAlt, true: Colors.blue500 }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const authToken = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleLogout = () => {
    Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
    ]).finally(() => {
      clearAuth();
      router.replace('/(auth)/login' as any);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <SettingsGroup title="账号安全" styles={styles}>
          <SettingsRow
            label="账号安全"
            value="管理 邮箱 / 手机号 / 密码"
            onPress={() => router.push('/account-security' as any)}
            showArrow
            styles={styles}
          />
        </SettingsGroup>

        <SettingsGroup title="订阅" styles={styles}>
          <SettingsRow
            label="会员状态"
            value={user.isPro ? 'PRO（已激活）' : '免费用户'}
            valueColor={user.isPro ? Colors.amber500 : undefined}
            showArrow={false}
            styles={styles}
          />
          {!user.isPro && (
            <>
              <View style={styles.rowDivider} />
              <SettingsRow
                label="升级 Pro"
                value="解锁全部研究科 + 不限数量过去问"
                valueColor={Colors.amber500}
                onPress={() => router.push('/paywall' as any)}
                showArrow
                styles={styles}
              />
            </>
          )}
        </SettingsGroup>

        <SettingsGroup title="外观" styles={styles}>
          <ThemeToggleRow styles={styles} />
        </SettingsGroup>

        <SettingsGroup title="通知" styles={styles}>
          <SettingsToggle label="新过去问推送" defaultOn={true} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsToggle label="弱点提醒" defaultOn={true} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsToggle label="论坛 @ 我" defaultOn={true} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsToggle label="贡献被采纳" defaultOn={true} styles={styles} />
        </SettingsGroup>

        <SettingsGroup title="其他" styles={styles}>
          <SettingsRow label="隐私政策" onPress={() => Linking.openURL('https://kakomon.app/privacy')} showArrow styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsRow label="服务条款" onPress={() => Linking.openURL('https://kakomon.app/terms')} showArrow styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsRow label="App 版本" value="0.13.0 · MVP" showArrow={false} styles={styles} />
        </SettingsGroup>

        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>退出登录</Text>
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
