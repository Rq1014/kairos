import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Chip, Icon, WheelDatePicker } from '@/components/ui';
import { EditTargetSheet } from '@/components/study/EditTargetSheet';
import { getUniversities } from '@/api/universities';
import { patchMe } from '@/api/user';
import { useAuthStore } from '@/store/authStore';
import { useAttemptStore } from '@/store/attemptStore';
import type { EditTargetConfig, NextExam } from '@/types/user';
import {
  KAKOMON_QUESTIONS,
  KAKOMON_UNIVERSITIES,
  DEMO_USER,
} from '@/mocks/data';
import { dictGradName, dictMajors, useDictStore } from '@/store/dictStore';

const URGENCY_COLOR = (days: number) =>
  days < 30 ? '#f43f5e' : days < 90 ? '#f59e0b' : '#3b82f6';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, paddingTop: 8, gap: 0 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: Spacing.md },
  headerLeft: { flex: 1, gap: 4 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  greeting: { fontSize: Typography.xs, color: c.textMuted },
  nickname: { fontSize: Typography['2xl'], fontWeight: Typography.weightBold, color: c.textPrimary, letterSpacing: -0.3 },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  targetSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 4, lineHeight: Typography.xs * 1.5 },

  // Countdown（加宽的横向 pill：图标 + 倒计时说明 + 天数）
  countdownBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 44, borderRadius: 12, paddingHorizontal: 12 },
  countdownTextCol: { alignItems: 'flex-start' },
  countdownLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3, fontWeight: Typography.weightSemibold },
  countdownDaysRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  countdownDays: { fontSize: 18, fontWeight: Typography.weightBold, color: '#fff', letterSpacing: -0.5 },
  countdownUnit: { fontSize: 11, fontWeight: Typography.weightSemibold, color: '#fff', opacity: 0.85 },
  setExamBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, borderRadius: 12, paddingHorizontal: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  addSchoolBtn: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: c.blue500 + '22', borderWidth: 1, borderColor: c.blue500 + '55' },
  bellBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
  bellDot: { position: 'absolute', top: 7, right: 7, width: 7, height: 7, backgroundColor: c.rose500, borderRadius: 4 },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  sectionMore: { fontSize: Typography.xs, color: c.textMuted },

  // Mode buttons (专题学习 / 模拟考试)
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  modeBtn: { flex: 1, borderRadius: Spacing.cardRadius, padding: 14, gap: 6 },
  modeBtnTitle: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  modeBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },

  // Hero "继续做题"
  hero: { backgroundColor: c.blue600, borderRadius: Spacing.cardRadius, padding: Spacing.lg, gap: 12 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.85)', fontWeight: Typography.weightSemibold, letterSpacing: 0.3 },
  heroTitle: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: '#fff', letterSpacing: -0.3 },
  heroMeta: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.85)' },
  heroProgressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroProgressFill: { height: 5, borderRadius: 3, backgroundColor: '#fff' },
  heroBtn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  heroBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.blue600 },

  // Quick actions
  quickGrid: { flexDirection: 'row', gap: 8 },
  quickItem: { flex: 1, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, gap: 6 },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: Typography.xs, fontWeight: Typography.weightMedium, color: c.textSecondary },

  // Exam date editor modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: c.background, borderRadius: 16, padding: 20, gap: 14 },
  modalTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  modalLabel: { fontSize: Typography.xs, color: c.textMuted },
  modalInput: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: Typography.sm, color: c.textPrimary },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalBtnGhost: { backgroundColor: c.surface },
  modalBtnGhostText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  modalBtnPrimary: { backgroundColor: c.blue600 },
  modalBtnPrimaryText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
});

export default function StudyScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  // Subscribe to dict version so component re-renders when dictionary refreshes
  useDictStore((s) => s.version);
  const queryClient = useQueryClient();

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const setUser = useAuthStore((s) => s.setUser);
  const authToken = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [examEditorOpen, setExamEditorOpen] = useState(false);
  const [examDateDraft, setExamDateDraft] = useState('');

  const targetConfig: EditTargetConfig = {
    type: (user.targetSchools[0]?.type === 'gakubu' ? 'gakubu' : 'daigakuin') as 'daigakuin' | 'gakubu',
    entries: user.targetSchools.map((s) => ({ universityId: s.universityId, gradSchool: s.gradSchool ?? '', majorId: s.majorId })),
    subjects: user.targetSchools[0]?.subjects ?? [],
    grad: user.major ?? '',
  };

  function handleSaveTarget(cfg: EditTargetConfig) {
    const targetSchools = cfg.entries.map((e, idx) => ({
      universityId: e.universityId,
      type: cfg.type,
      gradSchool: e.gradSchool || undefined,
      majorId: e.majorId || undefined,
      subjects: cfg.subjects,
      priority: idx + 1,
    }));
    setUser({ ...user, major: cfg.grad, targetSchools }, authToken, refreshToken);
  }

  // Persist exam date to backend (nextExam.date), with optimistic local update.
  const examMutation = useMutation({
    mutationFn: (nextExam: NextExam) => patchMe({ nextExam }),
    onSuccess: (updated) => {
      setUser({ ...user, ...updated }, authToken, refreshToken);
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });

  function openExamEditor() {
    // 预填已设日期，否则默认今天（让转盘有有效初值，保存即可生效）。
    const today = new Date();
    const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setExamDateDraft(user.nextExam?.date ?? fallback);
    setExamEditorOpen(true);
  }

  function handleSaveExamDate() {
    const date = examDateDraft.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const nextExam: NextExam = {
      name: user.nextExam?.name ?? '我的考试',
      date,
      durationDays: user.nextExam?.durationDays ?? 1,
    };
    // optimistic local update so countdown refreshes immediately
    setUser({ ...user, nextExam }, authToken, refreshToken);
    if (token) examMutation.mutate(nextExam);
    setExamEditorOpen(false);
  }

  const QUICK_ACTIONS = [
    { icon: 'search',   label: '搜过去问', route: '/search',     bgColor: Colors.blue50, iconColor: Colors.blue600 },
    { icon: 'flame',    label: '错题本',   route: '/wrong-book', bgColor: Colors.rose50, iconColor: Colors.rose600 },
    { icon: 'bookmark', label: '收藏',     route: '/favorites',  bgColor: Colors.indigo50, iconColor: Colors.indigo500 },
  ];

  const universitiesQuery = useQuery({
    queryKey: ['universities', 'study-targets'],
    queryFn: () => getUniversities({ page: 1, pageSize: 100 }),
  });

  const universities = universitiesQuery.data?.items?.length
    ? universitiesQuery.data.items
    : KAKOMON_UNIVERSITIES;

  const targetUniIds = user.targetSchools.map((s) => s.universityId);
  const targetUnis = universities.filter((u) => targetUniIds.includes(u.id));

  // 首次进入(无做题记录)时，hero 兜底用 mock 第一道题。
  const heroFallback = KAKOMON_QUESTIONS[0];

  // 「继续做题」优先级：上次未做完的题 → 最近做过的题 → 兜底题。
  const lastUnfinished = useAttemptStore((s) => s.lastUnfinished);
  const lastAttempt = useAttemptStore((s) => s.lastAttempt);
  useAttemptStore((s) => s.attempts); // 订阅，做题后即时刷新

  const resumeAttempt = lastUnfinished() ?? lastAttempt();
  const resumeQ = resumeAttempt
    ? KAKOMON_QUESTIONS.find((q) => q.id === resumeAttempt.questionId)
    : null;
  const continueQ = resumeQ ?? heroFallback;
  const continueIsResume = !!resumeQ;

  const exam = user.nextExam;
  const daysToExam = useMemo(() => {
    if (!exam) return null;
    return Math.max(0, Math.ceil((new Date(exam.date).getTime() - Date.now()) / 86_400_000));
  }, [exam]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>早上好，</Text>
            <Text style={styles.nickname}>{user.nickname}</Text>
            <View style={styles.targetRow}>
              {targetUnis.map((u) => (
                <Chip key={u.id} color="blue" size="sm" onPress={() => router.push(`/university/${u.id}` as any)}>
                  {u.short}
                </Chip>
              ))}
              <Pressable style={styles.addSchoolBtn} onPress={() => setSheetOpen(true)}>
                <Icon name="plus" size={13} color={Colors.blue500} />
              </Pressable>
            </View>
            {user.targetSchools[0] ? (
              <Text style={styles.targetSub}>
                {(() => {
                  const first = user.targetSchools[0];
                  const grad = first.gradSchool ?? '';
                  const major = first.majorId
                    ? (dictMajors(first.universityId, grad).find((m) => m.id === first.majorId)?.label ?? null)
                    : null;
                  return [dictGradName(first.universityId, grad), major].filter(Boolean).join(' · ') || '未指定研究科';
                })()}
              </Text>
            ) : (
              <Text style={styles.targetSub}>还没有目标校 · 点上方 ＋ 添加一个吧</Text>
            )}
          </View>

          <View style={styles.headerRight}>
            {daysToExam != null && exam ? (
              <Pressable
                style={[styles.countdownBadge, { backgroundColor: URGENCY_COLOR(daysToExam) }]}
                onPress={openExamEditor}
              >
                <Icon name="calendar" size={16} color="#fff" />
                <View style={styles.countdownTextCol}>
                  <Text style={styles.countdownLabel}>考试倒计时</Text>
                  <View style={styles.countdownDaysRow}>
                    <Text style={styles.countdownDays}>{daysToExam}</Text>
                    <Text style={styles.countdownUnit}>天</Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable style={styles.setExamBadge} onPress={openExamEditor}>
                <Icon name="plus" size={16} color={Colors.textSecondary} />
                <Text style={[styles.modalLabel, { marginTop: 1 }]}>设考试</Text>
              </Pressable>
            )}
            <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
              <Icon name="bell" size={18} color={Colors.textSecondary} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </View>

        {/* Mode buttons: 专题学习 / 模拟考试 */}
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, { backgroundColor: Colors.teal600 }]}
            onPress={() => router.push('/topic-study' as any)}
          >
            <Icon name="layers" size={20} color="#fff" />
            <Text style={styles.modeBtnTitle}>专题学习</Text>
            <Text style={styles.modeBtnSub}>按专题拆分 · 看难度</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, { backgroundColor: Colors.indigo600 }]}
            onPress={() => router.push('/mock-exam' as any)}
          >
            <Icon name="clock" size={20} color="#fff" />
            <Text style={styles.modeBtnTitle}>模拟考试</Text>
            <Text style={styles.modeBtnSub}>3 校 × 最近 3 年</Text>
          </Pressable>
        </View>

        {/* Hero: 继续做题 */}
        <View style={styles.section}>
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <Icon name="book" size={14} color="#fff" />
              <Text style={styles.heroEyebrow}>{continueIsResume ? '继续做题' : '开始做题'}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>{continueQ.title}</Text>
              <Text style={styles.heroMeta}>
                {continueQ.subject} · {continueQ.questionNo}
              </Text>
            </View>
            {continueIsResume && (
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, { width: '55%' }]} />
              </View>
            )}
            <Pressable style={styles.heroBtn} onPress={() => router.push(`/questions/${continueQ.id}`)}>
              <Icon name="forward" size={14} color={Colors.blue600} />
              <Text style={styles.heroBtnText}>{continueIsResume ? '继续做题' : '开始做题'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable key={a.label} style={styles.quickItem} onPress={() => router.push(a.route as any)}>
                <View style={[styles.quickIcon, { backgroundColor: a.bgColor }]}>
                  <Icon name={a.icon as any} size={18} color={a.iconColor} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>


        <View style={{ height: 32 }} />
      </ScrollView>

      <EditTargetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialConfig={targetConfig}
        onSave={handleSaveTarget}
        isPro={!!user.isPro}
        onUpgrade={() => { setSheetOpen(false); router.push('/paywall' as any); }}
      />

      {/* Exam date editor */}
      <Modal visible={examEditorOpen} transparent animationType="fade" onRequestClose={() => setExamEditorOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setExamEditorOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>设置考试日</Text>
            <WheelDatePicker
              value={examDateDraft}
              onChange={setExamDateDraft}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setExamEditorOpen(false)}>
                <Text style={styles.modalBtnGhostText}>取消</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleSaveExamDate}>
                <Text style={styles.modalBtnPrimaryText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
