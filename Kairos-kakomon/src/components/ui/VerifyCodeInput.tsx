import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors, type ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Icon } from './Icon';
import { sendVerificationCode, AuthError } from '@/api/auth';
import type { IdentityType } from '@/types/user';

const COUNTDOWN_SECONDS = 60;

export interface VerifyCodeInputProps {
  identityType: Extract<IdentityType, 'PHONE' | 'EMAIL'>;
  /** 邮箱已 toLowerCase / 手机号已 trim */
  identityValue: string;
  scene: 'BIND' | 'UNBIND' | 'RESET_PASSWORD';
  code: string;
  onChangeCode: (next: string) => void;
  /** identityValue 格式不合法时禁用「发送」按钮 */
  disabled?: boolean;
  /** 发送成功后回传 debugCode（demo 阶段直接展示） */
  onSent?: (debugCode: string) => void;
  /** 发送失败时回传错误文案 */
  onError?: (msg: string) => void;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: c.textPrimary,
    paddingVertical: 0,
  },
  codeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightSemibold,
    color: c.blue500,
  },
  codeBtnDisabled: {
    color: c.textMuted,
  },
});

export function VerifyCodeInput({
  identityType,
  identityValue,
  scene,
  code,
  onChangeCode,
  disabled,
  onSent,
  onError,
}: VerifyCodeInputProps) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // identityValue 变化（用户改了新邮箱/手机号）时,清空已输入验证码并重置倒计时,避免拿旧码去验新值
  useEffect(() => {
    onChangeCode('');
    setCountdown(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityValue]);

  const sendDisabled = disabled || sending || countdown > 0 || !identityValue;

  async function handleSend() {
    setSending(true);
    try {
      const { debugCode } = await sendVerificationCode({
        identityType,
        identityValue,
        scene,
      });
      setCountdown(COUNTDOWN_SECONDS);
      onSent?.(debugCode);
    } catch (e) {
      const msg =
        e instanceof AuthError && e.code === 'CODE_COOLDOWN'
          ? '验证码发送过于频繁，请稍后再试'
          : '验证码发送失败，请稍后再试';
      onError?.(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.inputRow}>
      <Icon name="message" size={18} color={Colors.textMuted} />
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(v) => onChangeCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="请输入 6 位验证码"
        placeholderTextColor={Colors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Pressable style={styles.codeBtn} hitSlop={6} disabled={sendDisabled} onPress={handleSend}>
        <Text style={[styles.codeBtnText, sendDisabled && styles.codeBtnDisabled]}>
          {sending ? '发送中…' : countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
        </Text>
      </Pressable>
    </View>
  );
}
