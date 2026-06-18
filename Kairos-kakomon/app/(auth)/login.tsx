import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import * as SecureStore from 'expo-secure-store';
import {
  AuthError,
  isRegistered,
  login as loginApi,
  loginWithCode as loginWithCodeApi,
  sendVerificationCode as sendCodeApi,
} from '@/api/auth';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@/api/client';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button, Icon, type IconName } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

type IdentifierMode = 'phone' | 'email';
type CredentialMode = 'password' | 'code';

interface SocialOption {
  key: string;
  label: string;
  icon: IconName;
  color: string;
}

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTDOWN_SECONDS = 60;

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.screenPadding + 4,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 22,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: c.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.blue600,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  brandLogoChar: {
    fontSize: 24,
    fontWeight: Typography.weightBold,
    color: '#fff',
  },
  brandName: {
    fontSize: Typography.md,
    fontWeight: Typography.weightBold,
    color: c.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: Typography.xs,
    color: c.textMuted,
    marginTop: 2,
  },

  heading: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.weightBold,
    color: c.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography['3xl'] * Typography.lineHeightTight,
    marginTop: 12,
  },
  subheading: {
    fontSize: Typography.sm,
    color: c.textSecondary,
    lineHeight: Typography.sm * Typography.lineHeightRelaxed,
  },

  modeRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  modeItem: {
    paddingBottom: 8,
  },
  modeText: {
    fontSize: Typography.md,
    fontWeight: Typography.weightSemibold,
    color: c.textMuted,
  },
  modeTextActive: {
    color: c.textPrimary,
  },
  modeUnderline: {
    height: 2,
    width: 28,
    backgroundColor: c.blue500,
    borderRadius: 2,
    marginTop: 6,
  },

  form: { gap: 14 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: c.blue500,
  },
  countryCode: {
    fontSize: Typography.base,
    fontWeight: Typography.weightSemibold,
    color: c.textPrimary,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: c.border,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: c.textPrimary,
    paddingVertical: 0,
  },
  visibilityBtn: {
    padding: 6,
  },
  codeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  codeBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightSemibold,
    color: c.blue500,
  },
  codeBtnTextDisabled: {
    color: c.textMuted,
  },

  credSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  credSwitchText: {
    fontSize: Typography.xs,
    fontWeight: Typography.weightSemibold,
    color: c.blue500,
  },
  credSwitchDisabled: {
    color: c.textMuted,
  },
  forgotText: {
    fontSize: Typography.xs,
    fontWeight: Typography.weightSemibold,
    color: c.blue500,
  },

  hint: {
    fontSize: Typography.xs,
    color: c.textMuted,
    marginLeft: 4,
    lineHeight: Typography.xs * Typography.lineHeightRelaxed,
  },
  hintWarn: {
    color: c.amber500,
  },
  errorText: {
    fontSize: Typography.xs,
    color: c.rose500,
    marginLeft: 4,
    lineHeight: Typography.xs * Typography.lineHeightRelaxed,
  },

  socialBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  socialTrigger: {
    alignItems: 'center',
    gap: 4,
  },
  socialMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialMoreLabel: {
    fontSize: Typography.xs,
    color: c.textMuted,
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  socialBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: {
    fontSize: 10,
    color: c.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  socialItem: {
    alignItems: 'center',
    width: 44,
  },

  legalText: {
    fontSize: Typography.xs,
    color: c.textMuted,
    textAlign: 'center',
    lineHeight: Typography.xs * Typography.lineHeightRelaxed,
    marginTop: 24,
  },
  legalLink: {
    color: c.blue500,
    fontWeight: Typography.weightMedium,
  },
});

export default function LoginScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [mode, setMode] = useState<IdentifierMode>('phone');
  const [credMode, setCredMode] = useState<CredentialMode>('code');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [secretFocused, setSecretFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [forceCode, setForceCode] = useState(false); // 首次登录强制验证码

  const [socialExpanded, setSocialExpanded] = useState(false);
  const socialAnim = useRef(new Animated.Value(0)).current;

  const setUser = useAuthStore((s) => s.setUser);

  const SOCIAL_OPTIONS: SocialOption[] = useMemo(
    () => [
      { key: 'wechat', label: '微信',  icon: 'message',  color: '#07c160' },
      { key: 'line',   label: 'LINE',  icon: 'message',  color: '#00b900' },
      { key: 'apple',  label: 'Apple', icon: 'user',     color: Colors.textPrimary },
    ],
    [Colors.textPrimary],
  );

  useEffect(() => {
    Animated.timing(socialAnim, {
      toValue: socialExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [socialExpanded, socialAnim]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const socialWidth = socialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SOCIAL_OPTIONS.length * 44 + (SOCIAL_OPTIONS.length - 1) * 12 + 12],
  });
  const socialOpacity = socialAnim;

  const identifierLabel = mode === 'phone' ? '手机号' : '邮箱';
  const identifierPlaceholder = mode === 'phone' ? '请输入手机号' : '请输入邮箱';
  const usingCode = credMode === 'code';

  function switchIdentifier(next: IdentifierMode) {
    if (next === mode) return;
    setMode(next);
    setIdentifier('');
    setPassword('');
    setCode('');
    setErrorMessage(null);
    setInfoMessage(null);
    setForceCode(false);
    setCredMode('code');
  }

  function switchCredMode(next: CredentialMode) {
    if (next === credMode) return;
    setCredMode(next);
    setErrorMessage(null);
    setInfoMessage(null);
    setPassword('');
    setCode('');
  }

  function validateIdentifier(): { ok: true; payloadEmail: string } | { ok: false; message: string } {
    const trimmed = identifier.trim();
    if (!trimmed) return { ok: false, message: `请输入${identifierLabel}` };

    if (mode === 'phone') {
      if (!PHONE_REGEX.test(trimmed)) {
        return { ok: false, message: '请输入有效的手机号' };
      }
      return { ok: true, payloadEmail: `${trimmed}@phone.kakomon.local` };
    }

    const lower = trimmed.toLowerCase();
    if (!EMAIL_REGEX.test(lower)) {
      return { ok: false, message: '请输入有效的邮箱' };
    }
    return { ok: true, payloadEmail: lower };
  }

  async function handleSendCode() {
    setErrorMessage(null);
    setInfoMessage(null);
    const id = validateIdentifier();
    if (!id.ok) {
      setErrorMessage(id.message);
      return;
    }

    setSendingCode(true);
    try {
      const { debugCode } = await sendCodeApi({ email: id.payloadEmail });
      setCountdown(COUNTDOWN_SECONDS);
      setInfoMessage(`验证码已发送（演示验证码：${debugCode}）`);
    } catch {
      setErrorMessage('验证码发送失败，请稍后再试。');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit() {
    setErrorMessage(null);
    setInfoMessage(null);

    const id = validateIdentifier();
    if (!id.ok) {
      setErrorMessage(id.message);
      return;
    }

    if (usingCode) {
      if (!code.trim()) {
        setErrorMessage('请输入验证码');
        return;
      }
      if (!/^\d{6}$/.test(code.trim())) {
        setErrorMessage('验证码为 6 位数字');
        return;
      }
    } else {
      if (!password) {
        setErrorMessage('请输入密码');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('密码至少 6 位');
        return;
      }
    }

    setLoading(true);
    try {
      let auth;
      if (usingCode) {
        auth = await loginWithCodeApi({
          email: id.payloadEmail,
          code: code.trim(),
          identifierKind: mode,
          identifierRaw: identifier.trim(),
        });
      } else {
        auth = await loginApi({ email: id.payloadEmail, password });
      }

      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, auth.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, auth.refreshToken),
      ]);

      setUser(auth.user, auth.accessToken, auth.refreshToken);
      registerForPushNotificationsAsync().catch(() => {});
      // 不主动 replace —— (auth)/_layout 与 (tabs)/_layout 的 <Redirect> 会根据
      // onboardingCompleted 自动决定去 onboard-profile 还是 (tabs)/study。
      // 命令式 replace 在 setUser 触发 re-render 之前会试图 push 一个父 Stack
      // 还没注册的子路由，从而报「'REPLACE' was not handled by any navigator」。
    } catch (e) {
      if (e instanceof AuthError && e.code === 'USER_NOT_FOUND') {
        setForceCode(true);
        setCredMode('code');
        setPassword('');
        setErrorMessage('该账号未注册，请获取验证码完成注册。');
      } else if (e instanceof AuthError) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage('登录失败，请稍后重试。');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleIdentifierBlur() {
    setIdentifierFocused(false);
    const id = validateIdentifier();
    if (id.ok) {
      isRegistered(id.payloadEmail)
        .then((registered) => {
          if (!registered) {
            // 软提示:未注册仅在「验证码」模式下展示文案,不强制锁模式
            // 用户主动切到「密码」模式即视为想用密码登录(可能是已注册账号在测试)
            if (credMode === 'code') {
              setForceCode(true);
              setInfoMessage('该账号未注册，将通过验证码完成首次登录。');
            } else {
              setForceCode(false);
            }
          } else {
            setForceCode(false);
            setInfoMessage(null);
          }
        })
        .catch(() => {
          // 网络异常时不弹出错误，由提交时再处理
        });
    }
  }

  function handleSocialPress(option: SocialOption) {
    setErrorMessage(`${option.label} 登录暂未开放，敬请期待。`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <Text style={styles.brandLogoChar}>過</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Kakomon · 過去問</Text>
              <Text style={styles.brandSub}>大学院入试（修考）智能学习</Text>
            </View>
          </View>

          <View>
            <Text style={styles.heading}>登录 / 注册</Text>
            <Text style={styles.subheading}>
              首次登录将自动为你创建账户，把过去问拆到题，每题都讲透。
            </Text>
          </View>

          <View style={styles.modeRow}>
            {(['phone', 'email'] as IdentifierMode[]).map((m) => {
              const active = m === mode;
              return (
                <Pressable key={m} style={styles.modeItem} onPress={() => switchIdentifier(m)}>
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>
                    {m === 'phone' ? '手机号' : '邮箱'}
                  </Text>
                  {active && <View style={styles.modeUnderline} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.form}>
            <View style={[styles.inputRow, identifierFocused && styles.inputRowFocused]}>
              {mode === 'phone' ? (
                <>
                  <Text style={styles.countryCode}>+86</Text>
                  <View style={styles.divider} />
                </>
              ) : (
                <Icon name="message" size={18} color={Colors.textMuted} />
              )}
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={identifierPlaceholder}
                placeholderTextColor={Colors.textMuted}
                keyboardType={mode === 'phone' ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={mode === 'phone' ? 11 : 64}
                onFocus={() => setIdentifierFocused(true)}
                onBlur={handleIdentifierBlur}
              />
            </View>

            {usingCode ? (
              <View key="cred-code" style={[styles.inputRow, secretFocused && styles.inputRowFocused]}>
                <Icon name="message" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                  placeholder="请输入 6 位验证码"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setSecretFocused(true)}
                  onBlur={() => setSecretFocused(false)}
                />
                <Pressable
                  style={styles.codeBtn}
                  hitSlop={6}
                  disabled={countdown > 0 || sendingCode}
                  onPress={handleSendCode}
                >
                  <Text
                    style={[
                      styles.codeBtnText,
                      (countdown > 0 || sendingCode) && styles.codeBtnTextDisabled,
                    ]}
                  >
                    {sendingCode ? '发送中…' : countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View key="cred-password" style={[styles.inputRow, secretFocused && styles.inputRowFocused]}>
                <Icon name="lock" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="请输入密码"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  onFocus={() => setSecretFocused(true)}
                  onBlur={() => setSecretFocused(false)}
                />
                <Pressable
                  style={styles.visibilityBtn}
                  hitSlop={6}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Icon name="eye" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            )}

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : infoMessage ? (
              <Text style={[styles.hint, styles.hintWarn]}>{infoMessage}</Text>
            ) : (
              <Text style={styles.hint}>
                {forceCode
                  ? '该账号未注册，将通过验证码完成首次登录'
                  : '未注册的账号将通过验证码自动注册'}
              </Text>
            )}
          </View>

          <View style={styles.credSwitchRow}>
            <Pressable
              hitSlop={8}
              onPress={() => switchCredMode(usingCode ? 'password' : 'code')}
            >
              <Text style={styles.credSwitchText}>
                {usingCode ? '使用密码登录' : '使用验证码登录'}
              </Text>
            </Pressable>
            {!usingCode && (
              <Pressable hitSlop={8}>
                <Text style={styles.forgotText}>忘记密码？</Text>
              </Pressable>
            )}
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSubmit}
          >
            {usingCode ? '验证码登录 / 注册' : '登录'}
          </Button>

          <View style={styles.socialBlock}>
            <Pressable
              style={styles.socialTrigger}
              onPress={() => setSocialExpanded((v) => !v)}
              hitSlop={6}
            >
              <View style={styles.socialMoreBtn}>
                <Icon
                  name={socialExpanded ? 'close' : 'more'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </View>
              <Text
                style={styles.socialMoreLabel}
                numberOfLines={1}
                accessibilityElementsHidden={socialExpanded}
                importantForAccessibility={socialExpanded ? 'no-hide-descendants' : 'auto'}
              >
                {socialExpanded ? ' ' : '其它登录方式'}
              </Text>
            </Pressable>
            <Animated.View
              style={[
                styles.socialIconsRow,
                { width: socialWidth, opacity: socialOpacity },
              ]}
              pointerEvents={socialExpanded ? 'auto' : 'none'}
            >
              {SOCIAL_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  style={styles.socialItem}
                  onPress={() => handleSocialPress(option)}
                >
                  <View style={styles.socialBtn}>
                    <Icon name={option.icon} size={18} color={option.color} />
                  </View>
                  <Text style={styles.socialLabel}>{option.label}</Text>
                </Pressable>
              ))}
            </Animated.View>
          </View>

          <Text style={styles.legalText}>
            继续即代表同意{' '}
            <Text style={styles.legalLink}>服务条款</Text>
            {' '}与{' '}
            <Text style={styles.legalLink}>隐私政策</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
