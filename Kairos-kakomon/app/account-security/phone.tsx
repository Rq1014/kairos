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
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon, VerifyCodeInput } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { DEMO_USER } from '@/mocks/data';
import { AuthError, bindIdentity } from '@/api/auth';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

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
  label: { fontSize: Typography.sm, color: c.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: Typography.base, color: c.textPrimary, paddingVertical: 0 },

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

  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  currentValue: { fontSize: Typography.sm, color: c.textPrimary },
  currentMuted: { color: c.textMuted },
});

export default function BindPhoneScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const token = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);

  const initialPhone = user.phone ?? '';

  const [phoneDraft, setPhoneDraft] = useState('');
  const [code, setCode] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = phoneDraft.trim();
  const valid = !!trimmed && PHONE_REGEX.test(trimmed);
  const dirty = trimmed !== initialPhone;
  const showCodeRow = valid && dirty;

  function describeAuthError(e: unknown, fallback: string): string {
    if (e instanceof AuthError) {
      if (e.code === 'INVALID_CODE') return '验证码错误或已过期';
      if (e.code === 'IDENTITY_OCCUPIED') return '该手机号已被其他账号绑定';
      return e.message || fallback;
    }
    return fallback;
  }

  async function handleSubmit() {
    if (!valid) {
      Alert.alert('手机号格式不正确');
      return;
    }
    if (!dirty) {
      Alert.alert('新手机号与当前手机号相同');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('请填写 6 位验证码');
      return;
    }
    setSubmitting(true);
    try {
      const latest = await bindIdentity({ identityType: 'PHONE', identityValue: trimmed, code });
      setUser(latest, token, refreshToken);
      setCode('');
      setHint(null);
      Alert.alert('绑定成功', undefined, [{ text: '好', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('手机号绑定失败', describeAuthError(e, '请稍后再试'));
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
          <Text style={styles.headerTitle}>{initialPhone ? '修改手机号' : '绑定手机号'}</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.currentRow}>
              <Text style={styles.label}>当前手机号</Text>
              <Text style={[styles.currentValue, !initialPhone && styles.currentMuted]} numberOfLines={1}>
                {initialPhone || '未设置'}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{initialPhone ? '新手机号' : '手机号'}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={phoneDraft}
                onChangeText={(v) => {
                  const next = v.replace(/\D/g, '').slice(0, 11);
                  setPhoneDraft(next);
                  setHint(null);
                }}
                placeholder="请输入手机号"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                inputMode="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={11}
              />
            </View>

            {showCodeRow ? (
              <VerifyCodeInput
                identityType="PHONE"
                identityValue={trimmed}
                scene="BIND"
                code={code}
                onChangeCode={setCode}
                disabled={!valid}
                onSent={(debugCode) =>
                  setHint(debugCode ? `验证码已发送(演示验证码：${debugCode})` : '验证码已发送')
                }
                onError={(msg) => setHint(msg)}
              />
            ) : null}

            {hint ? (
              <Text style={[styles.hint, styles.hintWarn]}>{hint}</Text>
            ) : (
              <Text style={styles.hint}>
                {phoneDraft.trim()
                  ? valid
                    ? dirty
                      ? '获取验证码后填入即可绑定'
                      : '新手机号与当前手机号相同'
                    : '手机号格式不正确'
                  : '修改手机号需通过新手机号验证码确认绑定'}
              </Text>
            )}

            <Pressable
              style={[styles.primaryBtn, (submitting || !showCodeRow || code.length !== 6) && styles.primaryBtnDisabled]}
              disabled={submitting || !showCodeRow || code.length !== 6}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryBtnText}>{submitting ? '绑定中…' : '确定绑定手机号'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
