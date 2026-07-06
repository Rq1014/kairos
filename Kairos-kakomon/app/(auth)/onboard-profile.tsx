import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button, Icon, VerifyCodeInput, WheelDatePicker } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, gradName } from '@/mocks/data';
import {
  AuthError,
  bindIdentity,
  setPassword as setPasswordApi,
  updateUserProfile,
} from '@/api/auth';
import type { UserProfile, UserTargetSchool } from '@/types/user';

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PickerStep = 'uni' | 'grad' | 'major';

interface SelectedMajor {
  key: string;
  universityId: string;
  gradSchool: string;
  majorId: string;
  label: string;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.screenPadding + 4, paddingTop: 28, paddingBottom: 32, gap: 22 },

  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.weightBold,
    color: c.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography['2xl'] * Typography.lineHeightTight,
  },
  subheading: {
    fontSize: Typography.sm,
    color: c.textSecondary,
    lineHeight: Typography.sm * Typography.lineHeightRelaxed,
  },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightSemibold,
    color: c.textPrimary,
    marginLeft: 2,
  },
  required: { color: c.rose500, fontWeight: Typography.weightSemibold },
  optionalNote: { color: c.textMuted, fontWeight: Typography.weightRegular, fontSize: Typography.xs },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, fontSize: Typography.base, color: c.textPrimary, paddingVertical: 0 },
  bioInputRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bioInput: {
    flex: 1,
    fontSize: Typography.base,
    color: c.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  visibilityBtn: { padding: 6 },
  hint: { fontSize: Typography.xs, color: c.textMuted, marginLeft: 4 },
  errorText: { fontSize: Typography.xs, color: c.rose500, marginLeft: 4 },

  majorPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
  },
  majorPickerText: { fontSize: Typography.base, color: c.textPrimary },
  majorPickerPlaceholder: { color: c.textMuted },

  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
  },
  examText: { fontSize: Typography.base, color: c.textPrimary },
  examPlaceholder: { color: c.textMuted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: c.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '88%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  modalTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  modalClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  breadcrumb: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, flexWrap: 'wrap',
  },
  breadcrumbText: { fontSize: Typography.xs, color: c.textMuted },
  breadcrumbActive: { color: c.blue500, fontWeight: Typography.weightSemibold },
  breadcrumbSep: { fontSize: Typography.xs, color: c.textMuted },
  modalBack: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  pickRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickRowActive: { borderColor: c.blue500, backgroundColor: c.blue500 + '14' },
  pickRowTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  pickRowDesc: { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  groupTitle: { fontSize: Typography.xs, color: c.textMuted, marginTop: 14, marginBottom: 6, letterSpacing: 0.3 },
  emptyHint: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', paddingVertical: 24 },

  // Exam date modal
  examModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  examModalCard: { backgroundColor: c.background, borderRadius: 16, padding: 20, gap: 14 },
  examModalTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  examModalActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  examModalBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  examModalGhost: { backgroundColor: c.surface },
  examModalGhostText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  examModalPrimary: { backgroundColor: c.blue600 },
  examModalPrimaryText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: c.textMuted },

  bindBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: c.blue600,
  },
  bindBtnDisabled: { opacity: 0.5 },
  bindBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
  boundBadge: {
    fontSize: Typography.xs,
    fontWeight: Typography.weightSemibold,
    color: c.green500,
    marginLeft: 6,
  },
});

function findUniShort(uniId: string): string {
  return KAKOMON_UNIVERSITIES.find((u) => u.id === uniId)?.short ?? uniId;
}

export default function OnboardProfileScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [nickname, setNickname] = useState(user?.nickname || '小k');
  const [bio, setBio] = useState(user?.bio ?? '');

  // 用户用手机登录则要求填邮箱;用邮箱登录则要求填手机号
  const loggedInWithPhone = !!user?.phone;
  const realEmail = user?.email && !user.email.endsWith('@phone.kakomon.local') ? user.email : '';
  const [contactValue, setContactValue] = useState(
    loggedInWithPhone ? realEmail : (user?.phone ?? ''),
  );
  const [contactCode, setContactCode] = useState('');
  const [contactHint, setContactHint] = useState<string | null>(null);
  // 已成功绑定的联系方式(空 = 还未绑定;非空 = 当前展示框中的值已 bind 到后端)
  const [boundContact, setBoundContact] = useState<string>('');
  const [bindingContact, setBindingContact] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 三步选择：学校 → 学院 → 专业
  const [majorPickerOpen, setMajorPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<PickerStep>('uni');
  const [pickedUniId, setPickedUniId] = useState<string | null>(null);
  const [pickedGrad, setPickedGrad] = useState<string | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<SelectedMajor | null>(null);

  const [examDate, setExamDate] = useState('');
  const [examPickerOpen, setExamPickerOpen] = useState(false);
  const [examDraft, setExamDraft] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickedUniGrads = useMemo<string[]>(
    () => (pickedUniId ? (UNI_GRADS[pickedUniId] ?? []) : []),
    [pickedUniId],
  );
  const pickedMajors = useMemo(
    () => (pickedUniId && pickedGrad ? (UNI_MAJORS[`${pickedUniId}::${pickedGrad}`] ?? []) : []),
    [pickedUniId, pickedGrad],
  );

  function openMajorPicker() {
    if (selectedMajor) {
      setPickedUniId(selectedMajor.universityId);
      setPickedGrad(selectedMajor.gradSchool);
      setPickerStep('major');
    } else {
      setPickedUniId(null);
      setPickedGrad(null);
      setPickerStep('uni');
    }
    setMajorPickerOpen(true);
  }

  function closeMajorPicker() {
    setMajorPickerOpen(false);
  }

  function handlePickerBack() {
    if (pickerStep === 'major') {
      setPickerStep('grad');
    } else if (pickerStep === 'grad') {
      setPickerStep('uni');
      setPickedGrad(null);
    } else {
      closeMajorPicker();
    }
  }


  function validate(): { ok: true } | { ok: false; message: string } {
    if (!nickname.trim()) return { ok: false, message: '昵称不能为空' };
    if (!password) return { ok: false, message: '请输入密码' };
    if (password.length < 8 || password.length > 64) {
      return { ok: false, message: '密码长度需 8-64 位' };
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return { ok: false, message: '密码必须包含字母与数字' };
    }
    if (password !== confirmPassword) {
      return { ok: false, message: '两次输入的密码不一致' };
    }

    const trimmedContact = contactValue.trim();
    if (trimmedContact) {
      const normalized = loggedInWithPhone ? trimmedContact.toLowerCase() : trimmedContact;
      if (loggedInWithPhone) {
        if (!EMAIL_REGEX.test(normalized)) {
          return { ok: false, message: '请输入有效的邮箱（或留空）' };
        }
      } else {
        if (!PHONE_REGEX.test(normalized)) {
          return { ok: false, message: '请输入有效的手机号（或留空）' };
        }
      }
      if (boundContact !== normalized) {
        return { ok: false, message: `请先点击「确定绑定」完成${loggedInWithPhone ? '邮箱' : '手机号'}绑定` };
      }
    }
    return { ok: true };
  }

  function describeAuthError(e: unknown, fallback: string): string {
    if (e instanceof AuthError) {
      if (e.code === 'INVALID_CODE') return '验证码错误或已过期';
      if (e.code === 'IDENTITY_OCCUPIED') return '该手机号/邮箱已被其他账号绑定';
      if (e.code === 'INVALID_CREDENTIALS') return '当前密码不正确';
      return e.message || fallback;
    }
    return fallback;
  }

  /** 邮箱/手机号「确定绑定」按钮:格式 + 验证码 OK 后立即调 bindIdentity */
  async function handleBindContact() {
    if (!user) return;
    const trimmed = contactValue.trim();
    const normalized = loggedInWithPhone ? trimmed.toLowerCase() : trimmed;
    if (!trimmed) {
      Alert.alert(`请先输入${loggedInWithPhone ? '邮箱' : '手机号'}`);
      return;
    }
    if (loggedInWithPhone ? !EMAIL_REGEX.test(normalized) : !PHONE_REGEX.test(normalized)) {
      Alert.alert(`${loggedInWithPhone ? '邮箱' : '手机号'}格式不正确`);
      return;
    }
    if (contactCode.length !== 6) {
      Alert.alert('请填写 6 位验证码');
      return;
    }
    setBindingContact(true);
    try {
      const latest = await bindIdentity({
        identityType: loggedInWithPhone ? 'EMAIL' : 'PHONE',
        identityValue: normalized,
        code: contactCode,
      });
      setUser(latest, token, refreshToken);
      setBoundContact(normalized);
      setContactCode('');
      setContactHint('已绑定');
    } catch (e) {
      Alert.alert(`${loggedInWithPhone ? '邮箱' : '手机号'}绑定失败`, describeAuthError(e, '请稍后再试'));
    } finally {
      setBindingContact(false);
    }
  }

  async function handleSubmit() {
    if (!user) return;
    setErrorMessage(null);

    const v = validate();
    if (!v.ok) {
      setErrorMessage(v.message);
      return;
    }

    setSubmitting(true);
    try {
      // 1) 资料字段(昵称/bio/major/targetSchools/nextExam) → PATCH /api/users/me
      const updates: Partial<UserProfile> = {
        nickname: nickname.trim(),
        bio: bio.trim(),
      };
      if (selectedMajor) updates.major = selectedMajor.label;

      const targetSchools: UserTargetSchool[] = selectedMajor
        ? [{
            universityId: selectedMajor.universityId,
            type: 'daigakuin',
            gradSchool: selectedMajor.gradSchool,
            majorId: selectedMajor.majorId,
            subjects: [],
            priority: 1,
          }]
        : [];
      updates.targetSchools = targetSchools;

      if (examDate) {
        updates.nextExam = {
          name: user.nextExam?.name ?? '我的考试',
          date: examDate,
          durationDays: user.nextExam?.durationDays ?? 1,
        };
      }

      let latest: UserProfile;
      try {
        latest = await updateUserProfile(user.email, updates);
      } catch {
        setErrorMessage('资料保存失败,请稍后重试');
        return;
      }

      // 2) 密码 → setPassword(后端首次设密已不要求验证码)
      try {
        latest = await setPasswordApi({ newPassword: password });
      } catch (e) {
        setErrorMessage(describeAuthError(e, '密码设置失败'));
        setUser(latest, token, refreshToken);
        return;
      }

      // 3) onboardingCompleted=true 入库
      try {
        latest = await updateUserProfile(user.email, { onboardingCompleted: true });
      } catch {
        latest = { ...latest, onboardingCompleted: true };
      }

      setUser(latest, token, refreshToken);
      router.replace('/(tabs)/study');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkipOptional() {
    if (!password || !confirmPassword) {
      Alert.alert('密码必填', '请填写并确认密码,再跳过其它信息。');
      return;
    }
    handleSubmit();
  }

  const contactLabel = loggedInWithPhone ? '邮箱' : '手机号';
  const contactPlaceholder = loggedInWithPhone ? '可选 · 用于找回账号' : '可选 · 用于找回账号';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.heading}>完善资料</Text>
            <Text style={styles.subheading}>
              欢迎来到 Kakomon。补充以下信息可以让推荐更准,密码用于下次直接登录。
            </Text>
          </View>

          {/* 昵称 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>昵称 <Text style={styles.optionalNote}>· 默认 小k</Text></Text>
            <View style={styles.inputRow}>
              <Icon name="user" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="给自己取个名字"
                placeholderTextColor={Colors.textMuted}
                maxLength={30}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* 个人介绍 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>个人介绍 <Text style={styles.optionalNote}>· 可选</Text></Text>
            <View style={styles.bioInputRow}>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                placeholder="一句话介绍自己（最多 120 字）"
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={120}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* 联系方式（手机/邮箱反向） */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {contactLabel} <Text style={styles.optionalNote}>· 可选</Text>
              {boundContact && boundContact === (loggedInWithPhone ? contactValue.trim().toLowerCase() : contactValue.trim()) ? (
                <Text style={styles.boundBadge}>· 已绑定</Text>
              ) : null}
            </Text>
            <View style={styles.inputRow}>
              <Icon name={loggedInWithPhone ? 'message' : 'message'} size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={contactValue}
                onChangeText={(v) => {
                  setContactValue(loggedInWithPhone ? v : v.replace(/\D/g, ''));
                  setContactHint(null);
                  setBoundContact(''); // 改了就视为未绑定,需要重新点确定
                }}
                placeholder={contactPlaceholder}
                placeholderTextColor={Colors.textMuted}
                keyboardType={loggedInWithPhone ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={loggedInWithPhone ? 64 : 11}
              />
            </View>
            {contactValue.trim() && boundContact !== (loggedInWithPhone ? contactValue.trim().toLowerCase() : contactValue.trim()) ? (
              <>
                <VerifyCodeInput
                  identityType={loggedInWithPhone ? 'EMAIL' : 'PHONE'}
                  identityValue={loggedInWithPhone ? contactValue.trim().toLowerCase() : contactValue.trim()}
                  scene="BIND"
                  code={contactCode}
                  onChangeCode={setContactCode}
                  disabled={loggedInWithPhone
                    ? !EMAIL_REGEX.test(contactValue.trim().toLowerCase())
                    : !PHONE_REGEX.test(contactValue.trim())}
                  onSent={(debugCode) =>
                    setContactHint(debugCode ? `验证码已发送(演示验证码：${debugCode})` : '验证码已发送')
                  }
                  onError={(msg) => setContactHint(msg)}
                />
                {contactHint ? <Text style={styles.hint}>{contactHint}</Text> : null}
                <Pressable
                  style={[styles.bindBtn, (bindingContact || contactCode.length !== 6) && styles.bindBtnDisabled]}
                  disabled={bindingContact || contactCode.length !== 6}
                  onPress={handleBindContact}
                >
                  <Text style={styles.bindBtnText}>
                    {bindingContact ? '绑定中…' : `确定绑定${loggedInWithPhone ? '邮箱' : '手机号'}`}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {/* 密码必填 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>登录密码 <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputRow}>
              <Icon name="lock" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="设置密码（8-64 位,需含字母与数字）"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                maxLength={64}
              />
              <Pressable style={styles.visibilityBtn} hitSlop={6} onPress={() => setShowPassword((v) => !v)}>
                <Icon name="eye" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.inputRow}>
              <Icon name="lock" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="再次输入密码"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="oneTimeCode"
                maxLength={64}
              />
            </View>
            <Text style={styles.hint}>下次可以用 {loggedInWithPhone ? '手机号' : '邮箱'} + 密码直接登录</Text>
          </View>

          {/* 目标学校/专业 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>目标学校/专业 <Text style={styles.optionalNote}>· 可选</Text></Text>
            <Pressable style={styles.majorPickerBtn} onPress={openMajorPicker}>
              <Text style={[styles.majorPickerText, !selectedMajor && styles.majorPickerPlaceholder]}>
                {selectedMajor ? selectedMajor.label : '选择 学校 → 学院 → 专业'}
              </Text>
              <Icon name="chevronRight" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* 考试日期 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>考试日期 <Text style={styles.optionalNote}>· 可选</Text></Text>
            <Pressable
              style={styles.examRow}
              onPress={() => {
                const today = new Date();
                const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                setExamDraft(examDate || fallback);
                setExamPickerOpen(true);
              }}
            >
              <Text style={[styles.examText, !examDate && styles.examPlaceholder]}>
                {examDate || '选择考试日期'}
              </Text>
              <Icon name="calendar" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Button variant="primary" size="lg" fullWidth loading={submitting} onPress={handleSubmit}>
            完成并进入
          </Button>

          <Pressable style={styles.skipBtn} onPress={handleSkipOptional}>
            <Text style={styles.skipBtnText}>仅填密码,稍后再说</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 专业选择 Modal —— 学校 → 学院 → 专业 */}
      <Modal visible={majorPickerOpen} transparent animationType="slide" onRequestClose={closeMajorPicker}>
        <Pressable style={styles.modalOverlay} onPress={closeMajorPicker}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalBack}
                onPress={handlePickerBack}
                hitSlop={6}
              >
                <Icon
                  name={pickerStep === 'uni' ? 'close' : 'chevronLeft'}
                  size={16}
                  color={Colors.textPrimary}
                />
              </Pressable>
              <Text style={styles.modalTitle}>
                {pickerStep === 'uni' ? '选择学校' : pickerStep === 'grad' ? '选择学院' : '选择专业'}
              </Text>
              <Pressable style={styles.modalClose} onPress={closeMajorPicker} hitSlop={6}>
                <Icon name="close" size={16} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.breadcrumb}>
              <Text style={[styles.breadcrumbText, pickerStep === 'uni' && styles.breadcrumbActive]}>
                {pickedUniId ? findUniShort(pickedUniId) : '学校'}
              </Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={[styles.breadcrumbText, pickerStep === 'grad' && styles.breadcrumbActive]}>
                {pickedGrad ? gradName(pickedUniId!, pickedGrad) : '学院'}
              </Text>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={[styles.breadcrumbText, pickerStep === 'major' && styles.breadcrumbActive]}>
                {selectedMajor && pickerStep === 'major' ? selectedMajor.majorId : '专业'}
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {pickerStep === 'uni' && KAKOMON_UNIVERSITIES.map((u) => {
                const grads = UNI_GRADS[u.id] ?? [];
                if (grads.length === 0) return null;
                const active = pickedUniId === u.id;
                return (
                  <Pressable
                    key={u.id}
                    style={[styles.pickRow, active && styles.pickRowActive]}
                    onPress={() => {
                      setPickedUniId(u.id);
                      setPickedGrad(null);
                      setPickerStep('grad');
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickRowTitle}>{u.short} · {u.nameJp}</Text>
                      <Text style={styles.pickRowDesc}>{grads.length} 个学院</Text>
                    </View>
                    <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                  </Pressable>
                );
              })}

              {pickerStep === 'grad' && pickedUniId && (
                pickedUniGrads.length === 0 ? (
                  <Text style={styles.emptyHint}>该学校暂无可选学院</Text>
                ) : (
                  pickedUniGrads.map((grad) => {
                    const majors = UNI_MAJORS[`${pickedUniId}::${grad}`] ?? [];
                    const active = pickedGrad === grad;
                    return (
                      <Pressable
                        key={grad}
                        style={[styles.pickRow, active && styles.pickRowActive]}
                        onPress={() => {
                          setPickedGrad(grad);
                          setPickerStep('major');
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickRowTitle}>{gradName(pickedUniId!, grad)}</Text>
                          <Text style={styles.pickRowDesc}>{majors.length} 个专业</Text>
                        </View>
                        <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                      </Pressable>
                    );
                  })
                )
              )}

              {pickerStep === 'major' && pickedUniId && pickedGrad && (
                pickedMajors.length === 0 ? (
                  <Text style={styles.emptyHint}>该学院暂无可选专业</Text>
                ) : (
                  pickedMajors.map((m) => {
                    const active = selectedMajor?.majorId === m.id
                      && selectedMajor?.universityId === pickedUniId
                      && selectedMajor?.gradSchool === pickedGrad;
                    return (
                      <Pressable
                        key={m.id}
                        style={[styles.pickRow, active && styles.pickRowActive]}
                        onPress={() => {
                          const uniShort = findUniShort(pickedUniId);
                          setSelectedMajor({
                            key: `${pickedUniId}::${pickedGrad}::${m.id}`,
                            universityId: pickedUniId,
                            gradSchool: pickedGrad,
                            majorId: m.id,
                            label: `${uniShort} · ${gradName(pickedUniId!, pickedGrad!)} · ${m.label}`,
                          });
                          closeMajorPicker();
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickRowTitle}>{m.label}</Text>
                        </View>
                        {active && <Icon name="check" size={16} color={Colors.blue500} />}
                      </Pressable>
                    );
                  })
                )
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 考试日期 Modal */}
      <Modal visible={examPickerOpen} transparent animationType="fade" onRequestClose={() => setExamPickerOpen(false)}>
        <Pressable style={styles.examModalOverlay} onPress={() => setExamPickerOpen(false)}>
          <Pressable style={styles.examModalCard} onPress={() => {}}>
            <Text style={styles.examModalTitle}>设置考试日</Text>
            <WheelDatePicker value={examDraft} onChange={setExamDraft} />
            <View style={styles.examModalActions}>
              <Pressable style={[styles.examModalBtn, styles.examModalGhost]} onPress={() => setExamPickerOpen(false)}>
                <Text style={styles.examModalGhostText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.examModalBtn, styles.examModalPrimary]}
                onPress={() => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(examDraft)) setExamDate(examDraft);
                  setExamPickerOpen(false);
                }}
              >
                <Text style={styles.examModalPrimaryText}>确定</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
