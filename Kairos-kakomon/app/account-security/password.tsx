import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { DEMO_USER } from '@/mocks/data';
import { AuthError, setPassword as setPasswordApi } from '@/api/auth';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/api/client';

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
    padding: Spacing.cardPadding,
    gap: 10,
  },
  fieldLabel: { fontSize: Typography.sm, color: c.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    gap: 8,
  },
  input: { flex: 1, fontSize: Typography.base, color: c.textPrimary, paddingVertical: 0 },
  eyeBtn: { padding: 4 },

  hint: { fontSize: Typography.xs, color: c.textMuted, lineHeight: 18 },
  hintWarn: { color: c.amber500 },

  primaryBtn: {
    marginTop: 8,
    backgroundColor: c.blue600,
    borderRadius: Spacing.cardRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: '#fff' },
});

export default function PasswordScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const token = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasPassword = !!user.hasPassword;

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleAuthError(e: unknown, fallbackTitle: string) {
    if (e instanceof AuthError) {
      const msg =
        e.code === 'INVALID_CREDENTIALS' ? '当前密码不正确'
        : e.code === 'INVALID_CODE' ? '验证码错误或已过期'
        : e.code === 'PASSWORD_NOT_SET' ? '账号尚未设置密码'
        : e.message;
      Alert.alert(fallbackTitle, msg);
    } else {
      Alert.alert(fallbackTitle, '请稍后重试');
    }
  }

  async function handleSubmit() {
    if (submitting) return;

    if (!newPwd || newPwd.length < 8) {
      Alert.alert('密码至少 8 位');
      return;
    }
    if (newPwd.length > 64) {
      Alert.alert('密码长度不能超过 64 位');
      return;
    }
    if (!/[A-Za-z]/.test(newPwd) || !/\d/.test(newPwd)) {
      Alert.alert('密码必须包含字母与数字');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('两次输入的密码不一致');
      return;
    }
    if (hasPassword && !oldPwd) {
      Alert.alert('请填写当前密码');
      return;
    }

    setSubmitting(true);
    try {
      const latest = await setPasswordApi({
        oldPassword: hasPassword ? oldPwd : undefined,
        newPassword: newPwd,
      });

      if (hasPassword) {
        Alert.alert(
          '密码修改成功',
          '为了安全请重新登录',
          [
            {
              text: '好',
              onPress: async () => {
                await Promise.all([
                  SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
                  SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
                ]);
                clearAuth();
                router.replace('/(auth)/login' as any);
              },
            },
          ],
        );
        return;
      }

      setUser({ ...latest, hasPassword: true }, token, refreshToken);
      Alert.alert('密码设置成功', undefined, [{ text: '好', onPress: () => router.back() }]);
    } catch (e) {
      handleAuthError(e, '密码设置失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{hasPassword ? '修改登录密码' : '设置登录密码'}</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {hasPassword ? (
              <>
                <Text style={styles.fieldLabel}>当前密码</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={oldPwd}
                    onChangeText={setOldPwd}
                    placeholder="请输入当前密码"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showOld}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    maxLength={64}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    hitSlop={8}
                    onPress={() => setShowOld((s) => !s)}
                    accessibilityRole="button"
                    accessibilityLabel={showOld ? '隐藏密码' : '显示密码'}
                  >
                    <Icon name={showOld ? 'eyeOff' : 'eye'} size={18} color={Colors.textMuted} />
                  </Pressable>
                </View>
              </>
            ) : null}

            <Text style={styles.fieldLabel}>{hasPassword ? '新密码' : '登录密码'}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder={hasPassword ? '新密码(8-64 位,需含字母与数字)' : '8-64 位,需含字母与数字'}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                maxLength={64}
              />
              <Pressable
                style={styles.eyeBtn}
                hitSlop={8}
                onPress={() => setShowNew((s) => !s)}
                accessibilityRole="button"
                accessibilityLabel={showNew ? '隐藏密码' : '显示密码'}
              >
                <Icon name={showNew ? 'eyeOff' : 'eye'} size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>确认密码</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                placeholder="再次输入新密码"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                maxLength={64}
              />
              <Pressable
                style={styles.eyeBtn}
                hitSlop={8}
                onPress={() => setShowConfirm((s) => !s)}
                accessibilityRole="button"
                accessibilityLabel={showConfirm ? '隐藏密码' : '显示密码'}
              >
                <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.hint}>
              {hasPassword
                ? '修改密码后会退出登录,请使用新密码重新登录'
                : '首次设置密码无需验证码,直接保存即可'}
            </Text>

            <Pressable
              style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
              disabled={submitting}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? '保存中…' : hasPassword ? '保存新密码' : '设置密码'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
