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
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Avatar, Icon, WheelDatePicker } from '@/components/ui';
import { EditTargetSheet } from '@/components/study/EditTargetSheet';
import { useAuthStore } from '@/store/authStore';
import { KAKOMON_UNIVERSITIES, DEMO_USER, UNI_GRADS, UNI_MAJORS, gradName } from '@/mocks/data';
import type { EditTargetConfig, UserTargetSchool } from '@/types/user';
import { updateUserProfile, replaceTargetSchools } from '@/api/auth';

type MajorPickerStep = 'uni' | 'grad' | 'major';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: c.blue600, borderRadius: 20 },
  saveBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },

  scroll: { paddingHorizontal: Spacing.screenPadding, paddingTop: 16 },

  section: { marginBottom: Spacing.lg },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  sectionCount: { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightSemibold },

  card: {
    backgroundColor: c.surface, borderRadius: Spacing.cardRadius,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  rowDivider: { height: 1, backgroundColor: c.border, marginLeft: Spacing.md },

  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  fieldLabel: { width: 80, fontSize: Typography.sm, color: c.textSecondary },
  fieldValue: { flex: 1 },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 8,
  },
  identityLabel: { width: 80, fontSize: Typography.sm, color: c.textSecondary },
  identityValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  identityValue: { fontSize: Typography.sm, color: c.textPrimary },
  identityValueMuted: { color: c.textMuted },
  identityBoundBadge: {
    fontSize: 10,
    fontWeight: Typography.weightSemibold,
    color: c.green500,
    backgroundColor: c.green500 + '1f',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding },
  swatchWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: c.textPrimary },
  swatchAuto: { backgroundColor: c.surfaceAlt },
  swatchAutoText: { fontSize: 9, color: c.textSecondary, fontWeight: Typography.weightSemibold },

  input: { fontSize: Typography.sm, color: c.textPrimary, textAlign: 'right' },
  dateField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minHeight: 22 },
  dateFieldText: { fontSize: Typography.sm, color: c.textPrimary },
  bioInput: { fontSize: Typography.sm, color: c.textPrimary, textAlign: 'left', minHeight: 64, textAlignVertical: 'top' },

  // 考试日期滚轮弹窗（与学习首页一致）
  examModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  examModalCard: { backgroundColor: c.background, borderRadius: 16, padding: 20, gap: 14 },
  examModalTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  examModalActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  examModalBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  examModalGhost: { backgroundColor: c.surface },
  examModalGhostText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  examModalPrimary: { backgroundColor: c.blue600 },
  examModalPrimaryText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
  readOnlyValue: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'right' },

  // Target school summary (reuses EditTargetSheet)
  schoolEntry: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  schoolAvatar: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  schoolAvatarText: { fontSize: 13, fontWeight: Typography.weightBold, color: '#fff' },
  schoolInfo: { flex: 1, gap: 1 },
  schoolName: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  schoolSub: { fontSize: Typography.xs, color: c.textMuted },

  editTargetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, backgroundColor: c.blue500 + '14',
    borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.blue500 + '44',
    marginTop: 8,
  },
  editTargetBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.blue600 },

  emptyHint: { fontSize: Typography.xs, color: c.textMuted, paddingHorizontal: Spacing.md, paddingVertical: 14, textAlign: 'center' },

  bottomSaveBtn: {
    backgroundColor: c.blue600, borderRadius: Spacing.cardRadius,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  bottomSaveBtnText: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: '#fff' },

  // 目标专业行
  majorPickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  majorPickerLabel: { fontSize: Typography.sm, color: c.textSecondary, width: 80 },
  majorPickerValue: { flex: 1, fontSize: Typography.sm, color: c.textPrimary, textAlign: 'right' },
  majorPickerPlaceholder: { color: c.textMuted },

  // 选择 Modal
  pickModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickModalSheet: { backgroundColor: c.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, maxHeight: '88%' },
  pickModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' },
  pickModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  pickModalTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  pickModalIconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  pickBreadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, flexWrap: 'wrap' },
  pickBreadcrumbText: { fontSize: Typography.xs, color: c.textMuted },
  pickBreadcrumbActive: { color: c.blue500, fontWeight: Typography.weightSemibold },
  pickBreadcrumbSep: { fontSize: Typography.xs, color: c.textMuted },
  pickModalBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  pickRow: {
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickRowActive: { borderColor: c.blue500, backgroundColor: c.blue500 + '14' },
  pickRowTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  pickRowDesc: { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  pickEmptyHint: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', paddingVertical: 24 },
});

export default function EditProfileScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const accent500: Record<string, string> = useMemo(() => ({
    blue: Colors.blue500, teal: Colors.teal500, indigo: Colors.indigo500,
    amber: Colors.amber500, rose: Colors.rose500, green: Colors.green500,
  }), [Colors]);

  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const token = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [nickname, setNickname] = useState(user.nickname);
  const [bio, setBio] = useState(user.bio ?? '');
  const [submitting, setSubmitting] = useState(false);

  const initialRealEmail = useMemo(
    () => (user.email && !user.email.endsWith('@phone.kakomon.local') ? user.email : ''),
    [user.email],
  );
  const initialPhone = useMemo(() => user.phone ?? '', [user.phone]);

  const [examDate, setExamDate] = useState(user.nextExam?.date ?? '');
  const [examPickerOpen, setExamPickerOpen] = useState(false);
  const [examDraft, setExamDraft] = useState('');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);

  function goAccountSecurity() {
    router.push('/account-security' as any);
  }

  // 目标校直接读写全局 store（与学习首页一致，不再用本页局部草稿）。
  const targetSchools = user.targetSchools;

  // 3 步选择器：选定的学校→学院→专业 一旦选完即写回 targetSchools。
  // editingKey 标记当前正在编辑的现有条目，三元组 `${universityId}::${gradSchool}::${majorId}`。
  const [majorPickerOpen, setMajorPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<MajorPickerStep>('uni');
  const [pickedUniId, setPickedUniId] = useState<string | null>(null);
  const [pickedGrad, setPickedGrad] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [persisting, setPersisting] = useState(false);

  const entryKeyOf = (s: { universityId: string; gradSchool?: string; majorId?: string }) =>
    `${s.universityId}::${s.gradSchool ?? ''}::${s.majorId ?? ''}`;

  const pickedUniGrads = useMemo<string[]>(
    () => (pickedUniId ? (UNI_GRADS[pickedUniId] ?? []) : []),
    [pickedUniId],
  );
  const pickedMajors = useMemo(
    () => (pickedUniId && pickedGrad ? (UNI_MAJORS[`${pickedUniId}::${pickedGrad}`] ?? []) : []),
    [pickedUniId, pickedGrad],
  );

  function findUniShort(uniId: string): string {
    return KAKOMON_UNIVERSITIES.find((u) => u.id === uniId)?.short ?? uniId;
  }

  // 入口标签（顶部 picker row）：展示已选条目数与首条学校；不再单独凸显「专业」名。
  const summaryLabel = useMemo<string | null>(() => {
    if (targetSchools.length === 0) return null;
    const first = targetSchools[0];
    const uni = KAKOMON_UNIVERSITIES.find((u) => u.id === first.universityId);
    const head = uni ? uni.short : first.universityId;
    return targetSchools.length > 1
      ? `${head} 等 ${targetSchools.length} 项`
      : head;
  }, [targetSchools]);

  function openMajorPickerForAdd() {
    setEditingKey(null);
    setPickedUniId(null);
    setPickedGrad(null);
    setPickerStep('uni');
    setMajorPickerOpen(true);
  }

  function openMajorPickerForEdit(entryKey: string) {
    const ts = targetSchools.find((s) => entryKeyOf(s) === entryKey);
    if (!ts) return;
    setEditingKey(entryKey);
    setPickedUniId(ts.universityId);
    setPickedGrad(ts.gradSchool ?? null);
    setPickerStep(ts.gradSchool ? 'major' : 'grad');
    setMajorPickerOpen(true);
  }

  function closeMajorPicker() { setMajorPickerOpen(false); }

  function handleMajorPickerBack() {
    if (pickerStep === 'major') setPickerStep('grad');
    else if (pickerStep === 'grad') {
      setPickerStep('uni');
      setPickedGrad(null);
    } else closeMajorPicker();
  }

  /**
   * 把 3 步选择器的结果写回 targetSchools 并立即落库。
   * - 唯一键：`(universityId, gradSchool, majorId)` 三元组 —— 同校同学院不同专业是不同条目。
   * - 编辑模式（editingKey 非空）：替换该条目；若新的三元组已存在则去掉重复。
   * - 新增模式：若三元组重复则不重复添加；否则追加。
   */
  async function commitPickedMajor(uniId: string, grad: string, majorId: string) {
    const baseType = targetSchools[0]?.type ?? 'daigakuin';
    const newKey = `${uniId}::${grad}::${majorId}`;
    let nextTargets: UserTargetSchool[];

    if (editingKey) {
      const idx = targetSchools.findIndex((s) => entryKeyOf(s) === editingKey);
      if (idx >= 0) {
        const old = targetSchools[idx];
        const updated: UserTargetSchool = {
          ...old,
          universityId: uniId,
          gradSchool: grad,
          majorId,
        };
        // 若编辑后的三元组与其他已有条目冲突，去掉那条以免重复。
        nextTargets = targetSchools
          .map((s, i) => (i === idx ? updated : s))
          .filter((s, i) => i === idx || entryKeyOf(s) !== newKey);
      } else {
        nextTargets = targetSchools.some((s) => entryKeyOf(s) === newKey)
          ? targetSchools
          : [
              ...targetSchools,
              {
                universityId: uniId,
                type: baseType,
                gradSchool: grad,
                majorId,
                subjects: [],
                priority: targetSchools.length + 1,
              },
            ];
      }
    } else {
      nextTargets = targetSchools.some((s) => entryKeyOf(s) === newKey)
        ? targetSchools
        : [
            ...targetSchools,
            {
              universityId: uniId,
              type: baseType,
              gradSchool: grad,
              majorId,
              subjects: [],
              priority: targetSchools.length + 1,
            },
          ];
    }

    closeMajorPicker();
    setEditingKey(null);
    // 乐观更新，再入库；失败回滚到原列表并提示。
    const prev = targetSchools;
    setUser({ ...user, targetSchools: nextTargets }, token, refreshToken);
    setPersisting(true);
    try {
      const latest = await replaceTargetSchools(nextTargets);
      setUser(latest, token, refreshToken);
    } catch (e: any) {
      setUser({ ...user, targetSchools: prev }, token, refreshToken);
      Alert.alert('保存目标失败', e?.message ?? '请稍后再试');
    } finally {
      setPersisting(false);
    }
  }

  const AVATAR_COLORS = [Colors.blue500, Colors.teal500, Colors.indigo500, Colors.amber500, Colors.green500, Colors.rose500];

  const targetConfig: EditTargetConfig = {
    type: (targetSchools[0]?.type === 'gakubu' ? 'gakubu' : 'daigakuin') as 'daigakuin' | 'gakubu',
    entries: targetSchools.map((s) => ({ universityId: s.universityId, gradSchool: s.gradSchool ?? '', majorId: s.majorId })),
    subjects: targetSchools[0]?.subjects ?? [],
    grad: user.major ?? '',
  };

  async function handleSaveTarget(cfg: EditTargetConfig) {
    const nextTargets: UserTargetSchool[] = cfg.entries.map((e, idx) => ({
      universityId: e.universityId,
      type: cfg.type,
      gradSchool: e.gradSchool || undefined,
      majorId: e.majorId || undefined,
      subjects: cfg.subjects,
      priority: idx + 1,
    }));
    const prev = targetSchools;
    setUser({ ...user, targetSchools: nextTargets }, token, refreshToken);
    setPersisting(true);
    try {
      const latest = await replaceTargetSchools(nextTargets);
      setUser(latest, token, refreshToken);
    } catch (e: any) {
      setUser({ ...user, targetSchools: prev }, token, refreshToken);
      Alert.alert('保存目标失败', e?.message ?? '请稍后再试');
    } finally {
      setPersisting(false);
    }
  }

  async function handleSave() {
    if (submitting) return;

    if (!nickname.trim()) {
      Alert.alert('请输入昵称');
      return;
    }

    setSubmitting(true);
    try {
      // targetSchools 已在选择/编辑时即时入库；这里只 PATCH 普通字段。
      const latest = await updateUserProfile(initialRealEmail, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        avatarColor: avatarColor || undefined,
        major: summaryLabel ?? user.major,
        nextExam: examDate.trim()
          ? {
              name: user.nextExam?.name ?? '我的考试',
              date: examDate.trim(),
              durationDays: user.nextExam?.durationDays ?? 1,
            }
          : user.nextExam,
      });

      setUser(latest, token, refreshToken);
      router.back();
    } catch (e: any) {
      Alert.alert('保存失败', e?.message ?? '请稍后再试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>编辑资料</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>头像</Text>
            <View style={styles.avatarRow}>
              <Avatar name={nickname || user.nickname} size={64} color={avatarColor || undefined} />
              <View style={styles.swatchWrap}>
                {AVATAR_COLORS.map((col) => (
                  <Pressable
                    key={col}
                    style={[styles.swatch, { backgroundColor: col }, avatarColor === col && styles.swatchActive]}
                    onPress={() => setAvatarColor(col)}
                  >
                    {avatarColor === col && <Icon name="check" size={12} color="#fff" />}
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.swatch, styles.swatchAuto, !avatarColor && styles.swatchActive]}
                  onPress={() => setAvatarColor('')}
                >
                  <Text style={styles.swatchAutoText}>自动</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Basic info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本信息</Text>
            <View style={styles.card}>
              <FieldRow label="昵称" styles={styles}>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="输入昵称"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={30}
                  autoCorrect={false}
                />
              </FieldRow>
              <View style={styles.rowDivider} />
              {/* 邮箱 — 只读，跳「账号安全」维护 */}
              <Pressable style={styles.identityRow} onPress={goAccountSecurity}>
                <Text style={styles.identityLabel}>邮箱</Text>
                <View style={styles.identityValueWrap}>
                  {initialRealEmail ? <Text style={styles.identityBoundBadge}>已绑定</Text> : null}
                  <Text
                    style={[styles.identityValue, !initialRealEmail && styles.identityValueMuted]}
                    numberOfLines={1}
                  >
                    {initialRealEmail || '未设置'}
                  </Text>
                  <Icon name="chevronRight" size={14} color={Colors.textMuted} />
                </View>
              </Pressable>
              <View style={styles.rowDivider} />
              {/* 手机号 — 只读，跳「账号安全」维护 */}
              <Pressable style={styles.identityRow} onPress={goAccountSecurity}>
                <Text style={styles.identityLabel}>手机号</Text>
                <View style={styles.identityValueWrap}>
                  {initialPhone ? <Text style={styles.identityBoundBadge}>已绑定</Text> : null}
                  <Text
                    style={[styles.identityValue, !initialPhone && styles.identityValueMuted]}
                    numberOfLines={1}
                  >
                    {initialPhone || '未设置'}
                  </Text>
                  <Icon name="chevronRight" size={14} color={Colors.textMuted} />
                </View>
              </Pressable>
              <View style={styles.rowDivider} />
              <FieldRow label="个人介绍" styles={styles}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="一句话介绍自己（可选）"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={120}
                  autoCorrect={false}
                />
              </FieldRow>
            </View>
          </View>

          {/* Exam date — 与学习首页统一，用滚轮选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>考试日期</Text>
            <View style={styles.card}>
              <FieldRow label="目标考试" styles={styles}>
                <Pressable
                  style={styles.dateField}
                  onPress={() => {
                    const today = new Date();
                    const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    setExamDraft(examDate || fallback);
                    setExamPickerOpen(true);
                  }}
                >
                  <Text style={[styles.dateFieldText, !examDate && { color: Colors.textMuted }]}>
                    {examDate || '选择考试日期'}
                  </Text>
                  <Icon name="calendar" size={15} color={Colors.textMuted} />
                </Pressable>
              </FieldRow>
            </View>
          </View>

          {/* 目标学校/专业 */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>目标学校/专业</Text>
              <Text style={styles.sectionCount}>
                {persisting ? '同步中…' : `${targetSchools.length} 项已选`}
              </Text>
            </View>

            <View style={styles.card}>
              <Pressable
                style={styles.majorPickerRow}
                onPress={persisting ? undefined : openMajorPickerForAdd}
              >
                <Text
                  style={[styles.majorPickerValue, !summaryLabel && styles.majorPickerPlaceholder, { textAlign: 'left' }]}
                  numberOfLines={1}
                >
                  {summaryLabel ?? '选择 学校 → 学院 → 专业'}
                </Text>
                <Icon name="chevronRight" size={16} color={Colors.textMuted} />
              </Pressable>

              {targetSchools.length === 0 ? (
                <>
                  <View style={styles.rowDivider} />
                  <Text style={styles.emptyHint}>还没有选择目标学校</Text>
                </>
              ) : (
                targetSchools.map((ts) => {
                  const u = KAKOMON_UNIVERSITIES.find((x) => x.id === ts.universityId);
                  const major = ts.majorId && ts.gradSchool
                    ? UNI_MAJORS[`${ts.universityId}::${ts.gradSchool}`]?.find((m) => m.id === ts.majorId)?.label
                    : undefined;
                  const sub = [gradName(ts.universityId, ts.gradSchool ?? '') || '未指定研究科', major].filter(Boolean).join(' · ');
                  const bg = u ? (accent500[u.accent] ?? Colors.blue500) : Colors.blue500;
                  const head = u ? `${u.short} · ${u.nameJp}` : ts.universityId;
                  const initial = u?.short.slice(0, 1) ?? '?';
                  const entryKey = entryKeyOf(ts);
                  return (
                    <View key={entryKey}>
                      <View style={styles.rowDivider} />
                      <Pressable
                        style={styles.schoolEntry}
                        onPress={() => openMajorPickerForEdit(entryKey)}
                      >
                        <View style={[styles.schoolAvatar, { backgroundColor: bg }]}>
                          <Text style={styles.schoolAvatarText}>{initial}</Text>
                        </View>
                        <View style={styles.schoolInfo}>
                          <Text style={styles.schoolName}>{head}</Text>
                          <Text style={styles.schoolSub}>{sub}</Text>
                        </View>
                        <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>

            <Pressable style={styles.editTargetBtn} onPress={() => setSheetOpen(true)}>
              <Icon name="edit" size={14} color={Colors.blue600} />
              <Text style={styles.editTargetBtnText}>选择 / 修改目标学校</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.bottomSaveBtn, submitting && { opacity: 0.6 }]}
            disabled={submitting}
            onPress={handleSave}
          >
            <Text style={styles.bottomSaveBtnText}>{submitting ? '保存中…' : '保存更改'}</Text>
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <EditTargetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialConfig={targetConfig}
        onSave={handleSaveTarget}
        isPro={!!user.isPro}
        onUpgrade={() => { setSheetOpen(false); router.push('/paywall' as any); }}
      />

      {/* 考试日期滚轮（与学习首页一致） */}
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
                onPress={() => { if (/^\d{4}-\d{2}-\d{2}$/.test(examDraft)) setExamDate(examDraft); setExamPickerOpen(false); }}
              >
                <Text style={styles.examModalPrimaryText}>确定</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 目标专业选择 Modal —— 学校 → 学院 → 专业 */}
      <Modal
        visible={majorPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={closeMajorPicker}
      >
        <Pressable style={styles.pickModalOverlay} onPress={closeMajorPicker}>
          <Pressable style={styles.pickModalSheet} onPress={() => {}}>
            <View style={styles.pickModalHandle} />
            <View style={styles.pickModalHeader}>
              <Pressable style={styles.pickModalIconBtn} onPress={handleMajorPickerBack} hitSlop={6}>
                <Icon
                  name={pickerStep === 'uni' ? 'close' : 'chevronLeft'}
                  size={16}
                  color={Colors.textPrimary}
                />
              </Pressable>
              <Text style={styles.pickModalTitle}>
                {pickerStep === 'uni' ? '选择学校' : pickerStep === 'grad' ? '选择学院' : '选择专业'}
              </Text>
              <Pressable style={styles.pickModalIconBtn} onPress={closeMajorPicker} hitSlop={6}>
                <Icon name="close" size={16} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.pickBreadcrumb}>
              <Text style={[styles.pickBreadcrumbText, pickerStep === 'uni' && styles.pickBreadcrumbActive]}>
                {pickedUniId ? findUniShort(pickedUniId) : '学校'}
              </Text>
              <Text style={styles.pickBreadcrumbSep}>›</Text>
              <Text style={[styles.pickBreadcrumbText, pickerStep === 'grad' && styles.pickBreadcrumbActive]}>
                {pickedGrad ? gradName(pickedUniId!, pickedGrad) : '学院'}
              </Text>
              <Text style={styles.pickBreadcrumbSep}>›</Text>
              <Text style={[styles.pickBreadcrumbText, pickerStep === 'major' && styles.pickBreadcrumbActive]}>
                专业
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.pickModalBody}>
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
                  <Text style={styles.pickEmptyHint}>该学校暂无可选学院</Text>
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
                  <Text style={styles.pickEmptyHint}>该学院暂无可选专业</Text>
                ) : (
                  pickedMajors.map((m) => {
                    const candidateKey = `${pickedUniId}::${pickedGrad}::${m.id}`;
                    const active = editingKey === candidateKey
                      || targetSchools.some((s) => entryKeyOf(s) === candidateKey);
                    return (
                      <Pressable
                        key={m.id}
                        style={[styles.pickRow, active && styles.pickRowActive]}
                        onPress={() => commitPickedMajor(pickedUniId, pickedGrad, m.id)}
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
    </SafeAreaView>
  );
}

function FieldRow({ label, children, styles }: { label: string; children: React.ReactNode; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValue}>{children}</View>
    </View>
  );
}
