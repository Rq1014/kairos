import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { AdGateModal, Badge, Card, Chip, Icon } from '@/components/ui';
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';
import { useAdStore } from '@/store/adStore';
import { useAttemptStore } from '@/store/attemptStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { canAccessQuestion, isQuestionAccessible } from '@/utils/accessPolicy';
import { recommendRelated } from '@/utils/recommend';
import QuestionBlocks from '@/components/study/QuestionBlocks';
import type { KakomonQuestion, MasteryStatus, RelatedQuestion } from '@/types/question';

type CrowdVote = 'easy' | 'medium' | 'hard' | null;

// MVP 阶段隐藏 AI 相关内容；置 true 可恢复（代码保留）。
const SHOW_AI = false;
// MVP 阶段隐藏参考书相关内容；未来升级时置 true 可恢复（代码保留）。
const SHOW_REFERENCE = false;

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, gap: 0 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Sections
  section: { marginBottom: Spacing.lg },
  sectionCard: { padding: Spacing.cardPadding, gap: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  sectionMore: { fontSize: Typography.xs, color: c.textMuted },
  accentBar: { width: 4, height: 14, borderRadius: 2, backgroundColor: c.blue600 },

  // Metadata
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  title: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, lineHeight: Typography.base * 1.35 },
  metaLine: { fontSize: Typography.xs, color: c.textMuted },
  tag: { backgroundColor: c.surfaceAlt, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: Typography.xs, color: c.textSecondary },
  subjectTag: { backgroundColor: c.blue500 + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  subjectTagText: { fontSize: Typography.xs, color: c.blue600, fontWeight: Typography.weightSemibold },
  pointTag: { backgroundColor: c.indigo500 + '18', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pointTagText: { fontSize: Typography.xs, color: c.indigo500 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 4 },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffText: { fontSize: Typography.xs, color: c.textMuted },
  diffHard: { fontSize: Typography.xs, color: c.textMuted },
  diffPct: { fontWeight: Typography.weightBold, color: c.amber500 },
  voteCount: { fontSize: Typography.xs, color: c.textMuted },

  // Body
  bodyText: { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.7 },
  formulaBox: { backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 10, gap: 4, marginTop: 4 },
  formulaText: { fontSize: Typography.sm, color: c.blue100, fontFamily: 'monospace' },
  bodyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: c.border },
  ghostBtnText: { fontSize: Typography.xs, color: c.textMuted },

  // Mastery
  masteryGrid: { flexDirection: 'row', gap: 8 },
  masteryBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  masteryBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },
  masteryHint: { fontSize: Typography.xs, color: c.textMuted, textAlign: 'center', marginTop: 4 },
  nextRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.blue600, borderRadius: 10, paddingVertical: 12 },
  nextBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: c.blue500, justifyContent: 'center' },
  pickBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.blue600 },
  nextHint: { fontSize: Typography.xs, color: c.textMuted, marginTop: 6, textAlign: 'center' },
  recCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 5 },
  recTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recUni: { fontSize: Typography.xs, color: c.textMuted, fontWeight: Typography.weightSemibold },
  recTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  recTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  recTag: { backgroundColor: c.surfaceAlt, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  recTagText: { fontSize: Typography.xs, color: c.textSecondary },

  // Crowd vote
  crowdDesc: { fontSize: Typography.xs, color: c.textMuted },
  crowdGrid: { flexDirection: 'row', gap: 8 },
  crowdBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, gap: 4 },
  crowdBtnLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  crowdBtnPct: { fontSize: Typography.xs, color: c.textMuted },

  // Steps
  stepItem: { gap: 6 },
  stepGap: { marginTop: 14 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 6, backgroundColor: c.blue50, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 11, fontWeight: Typography.weightBold, color: c.blue600 },
  stepTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  stepBody: { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.7, paddingLeft: 30 },

  // Reference
  refCard: { gap: 8 },
  refHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  refIconWrap: { width: 30, height: 30, borderRadius: 6, backgroundColor: c.teal50, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  refMeta: { flex: 1, gap: 2, minWidth: 0 },
  refTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  refChapter: { fontSize: Typography.xs, color: c.textMuted },
  matchBadge: { backgroundColor: c.teal50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexShrink: 0 },
  matchBadgeText: { fontSize: 10, fontWeight: Typography.weightSemibold, color: c.teal500 },
  refSummary: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.6, marginTop: 4 },
  refPage: { fontWeight: Typography.weightBold, color: c.teal500 },
  refActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },

  // AI locked/unlocked
  lockedCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, overflow: 'hidden', minHeight: 140 },
  lockedBlur: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: Spacing.lg },
  lockedTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  upgradePillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.amber500, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  upgradePillText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
  aiUnlocked: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiUnlockedText: { fontSize: Typography.xs, color: c.amber500, fontWeight: Typography.weightSemibold },
  aiItem: { marginTop: 10, gap: 4 },
  aiItemTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  aiItemBody: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.6 },

  // Related questions
  relatedGroup: { gap: 8, marginBottom: 14 },
  relatedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  levelBadge: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { fontSize: 11, fontWeight: Typography.weightBold },
  levelLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },
  levelDesc: { fontSize: Typography.xs, color: c.textMuted },
  relatedCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 6 },
  relatedCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  relatedCardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  relatedUni: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted },
  relatedQno: { fontSize: Typography.xs, color: c.textMuted },
  relatedConf: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold },
  relatedLockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.amber500 + '22', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12 },
  relatedLockText: { fontSize: 10, color: c.amber600, fontWeight: Typography.weightBold },
  relatedTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, lineHeight: Typography.sm * 1.4 },
  relatedReason: { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.5 },

  // Forum
  forumCard: { backgroundColor: c.indigo600 + '22', borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.indigo600 + '44', padding: Spacing.cardPadding, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  forumText: { flex: 1, gap: 2 },
  forumTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.indigo500 },
  forumExcerpt: { fontSize: Typography.xs, color: c.textSecondary },

  emptyText: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', paddingVertical: 8 },

  // Sticky bar
  stickyBar: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.screenPadding, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
  forumBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  forumBtnText: { fontSize: Typography.sm, color: c.textSecondary },
  askAiBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.teal500, borderRadius: 10, paddingVertical: 10 },
  askAiBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
  quotaBadge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  quotaBadgeText: { fontSize: 10, fontWeight: Typography.weightBold, color: '#fff' },

  // Image viewer modal
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  imageModalClose: { position: 'absolute', top: 56, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  imageModalContent: { alignItems: 'center', gap: 12, padding: 32 },
  imageModalLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff', textAlign: 'center' },
  imageModalSub: { fontSize: Typography.xs, color: c.textMuted, textAlign: 'center' },
});

export default function QuestionDetailScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const MASTERY_OPTIONS = [
    { k: 'mastered' as MasteryStatus, label: '我会', activeColor: Colors.green500, bgColor: Colors.green50, textColor: Colors.green600 },
    { k: 'unclear'  as MasteryStatus, label: '模糊', activeColor: Colors.amber500, bgColor: Colors.amber50,  textColor: Colors.amber600 },
    { k: 'wrong'    as MasteryStatus, label: '不会', activeColor: Colors.rose500,  bgColor: Colors.rose50,   textColor: Colors.rose600  },
  ] as const;

  const RELATED_LEVEL_COLORS = {
    1: { bg: Colors.green50,  text: Colors.green600,  label: '同题',     desc: '完全相同考点' },
    2: { bg: Colors.blue50,   text: Colors.blue700,   label: '相似考点', desc: '同父概念 / 相似解法' },
    3: { bg: Colors.indigo50, text: Colors.indigo600, label: '跨校相似题', desc: '同学科 · 异校风格' },
  };

  const router = useRouter();
  const { id, list } = useLocalSearchParams<{ id: string; list?: string }>();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;

  // 列表上下文：从专题学习科目列表 / 错题本进入时带上 &list=id1,id2,...
  // 「下一题」按此顺序跳到下一个，而非全局任取。
  const listIds = useMemo(() => (list ? list.split(',').filter(Boolean) : []), [list]);

  const question = KAKOMON_QUESTIONS.find((q) => q.id === id) ?? KAKOMON_QUESTIONS[0];
  const university = KAKOMON_UNIVERSITIES.find((u) => u.id === question.universityId)!;
  const graduateSchoolFor = (questionId: string) =>
    KAKOMON_QUESTIONS.find((q) => q.id === questionId)?.graduateSchool;

  const [mastery, setMastery] = useState<MasteryStatus | null>(question.masteryStatus ?? null);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  useFavoritesStore((s) => s.ids); // 订阅，收藏状态变更即刷新
  const bookmarked = isFavorite(question.id);
  const [crowdVote, setCrowdVote] = useState<CrowdVote>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [relatedGate, setRelatedGate] = useState<RelatedQuestion | null>(null);
  // 「下一题」遇到锁定题时的广告闸（与相似题闸分开）。
  const [nextGate, setNextGate] = useState<KakomonQuestion | null>(null);

  // Subscribe so locked related cards refresh after an ad unlock.
  useAdStore((s) => s.unlockedQuestionIds);
  useAdStore((s) => s.unlockedSchoolYears);
  const unlockQuestion = useAdStore((s) => s.unlockQuestion);
  const unlockSchoolYear = useAdStore((s) => s.unlockSchoolYear);

  const recordAttempt = useAttemptStore((s) => s.recordAttempt);
  const setAttemptResult = useAttemptStore((s) => s.setAttemptResult);
  const attemptIdRef = useRef<string | null>(null);

  // 打开题目即记录一条做题记录（未评价 result=null）；切换题目时重记。
  useEffect(() => {
    attemptIdRef.current = recordAttempt({
      questionId: question.id,
      universityId: question.universityId,
      year: question.year,
      subject: question.subject,
      title: question.title,
    });
    setMastery(question.masteryStatus ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // 下一题：
  //  1) 有列表上下文(从专题/错题本进入) → 按列表顺序取当前之后的下一题（不跳过锁定题，
  //     锁定题在跳转时走广告闸，不绕过限制）；
  //  2) 否则 → 同科目、可访问、排在当前之后的题（兜底）。
  const nextQuestion = useMemo(() => {
    if (listIds.length > 0) {
      const idx = listIds.indexOf(question.id);
      const restIds = idx >= 0 ? listIds.slice(idx + 1) : listIds;
      for (const nid of restIds) {
        const q = KAKOMON_QUESTIONS.find((x) => x.id === nid);
        if (q) return q;
      }
      return null; // 列表已是最后一题
    }
    const accessible = KAKOMON_QUESTIONS.filter(
      (q) => q.id !== question.id && isQuestionAccessible(user, { universityId: q.universityId, gradSchool: q.graduateSchool, year: q.year, questionId: q.id }),
    );
    const sameSubject = accessible.filter((q) => q.subject === question.subject);
    return sameSubject[0] ?? accessible[0] ?? null;
  }, [question.id, question.subject, user, listIds]);

  // 跳转到下一题：先校验访问权限，锁定则弹广告闸，避免绕过限制。
  const goNext = () => {
    if (!nextQuestion) return;
    const suffix = listIds.length > 0 ? `?list=${listIds.join(',')}` : '';
    const access = canAccessQuestion(user, {
      universityId: nextQuestion.universityId, gradSchool: nextQuestion.graduateSchool, year: nextQuestion.year, questionId: nextQuestion.id,
    });
    if (access.allowed) {
      router.replace(`/questions/${nextQuestion.id}${suffix}` as any);
    } else {
      setNextGate(nextQuestion);
    }
  };

  function handleSetMastery(result: MasteryStatus) {
    setMastery(result);
    if (attemptIdRef.current) setAttemptResult(attemptIdRef.current, result);
  }

  // 同专题推荐（做完这道再练相关题）。
  const recommended = useMemo(
    () => recommendRelated({
      excludeQuestionId: question.id,
      knowledgePoints: question.knowledgePoints,
      subject: question.subject,
      limit: 3,
    }),
    [question.id, question.knowledgePoints, question.subject],
  );

  const crowdVotes = question.crowdVotes ?? { easy: 12, medium: 38, hard: 84 };
  const totalVotes = crowdVotes.easy + crowdVotes.medium + crowdVotes.hard;
  const hardPct = Math.round((crowdVotes.hard / totalVotes) * 100);
  const easyPct = Math.round((crowdVotes.easy / totalVotes) * 100);
  const mediumPct = Math.round((crowdVotes.medium / totalVotes) * 100);

  const relatedQuestions = question.relatedQuestions ?? [];
  const lvl1 = relatedQuestions.filter((r) => r.level === 1);
  const lvl2 = relatedQuestions.filter((r) => r.level === 2);
  const lvl3 = relatedQuestions.filter((r) => r.level === 3);

  const isPro = user.isPro;

  const MASTERY_HINT: Record<string, string> = {
    mastered: '已掌握，跨校相似题会减少推荐',
    unclear:  '稍后会再次推荐复习',
    wrong:    '已加入错题本，将出现在弱点地图',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{university.short} · {question.year}</Text>
          <Text style={styles.headerSub}>{question.subject} · {question.questionNo}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => toggleFavorite(question.id)}
          >
            <Icon
              name="bookmark"
              size={18}
              color={bookmarked ? Colors.amber500 : Colors.textSecondary}
            />
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={() => Alert.alert('更多操作', '', [
              { text: '举报内容', style: 'destructive', onPress: () => {} },
              { text: '取消', style: 'cancel' },
            ])}
          >
            <Icon name="more" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ① Metadata */}
        <View style={styles.section}>
          <Card style={styles.sectionCard}>
            <View style={styles.chipRow}>
              <Chip color={university.accent as 'blue' | 'teal' | 'indigo'} size="sm">
                {university.nameCn}
              </Chip>
              <Chip color="slate" size="sm">{question.graduateSchool}</Chip>
            </View>
            <Text style={styles.title}>{question.title}</Text>
            <Text style={styles.metaLine}>{question.year} · {question.subject} · {question.questionNo}</Text>
            <View style={styles.chipRow}>
              {question.knowledgePoints.map((k, i) => (
                <View key={k} style={i === 0 ? styles.subjectTag : styles.pointTag}>
                  <Text style={i === 0 ? styles.subjectTagText : styles.pointTagText}>#{k}</Text>
                </View>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.diffRow}>
              <View style={styles.diffLeft}>
                <Badge variant="free" />
                <Text style={styles.diffText}> · </Text>
                <Text style={styles.diffHard}>
                  <Text style={styles.diffPct}>{hardPct}%</Text>
                  {' '}用户认为偏难
                </Text>
              </View>
              <Text style={styles.voteCount}>{totalVotes} 票</Text>
            </View>
          </Card>
        </View>

        {/* ② Question body */}
        {(question.contentBlocks?.length || question.bodyText) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>题目</Text>
            <Card style={styles.sectionCard}>
              <QuestionBlocks blocks={question.contentBlocks} fallbackText={question.bodyText} />
              <View style={styles.bodyActions}>
                <Pressable style={styles.ghostBtn} onPress={() => setImageModalVisible(true)}>
                  <Icon name="eye" size={12} color={Colors.textMuted} />
                  <Text style={styles.ghostBtnText}>查看原版</Text>
                </Pressable>
                <Pressable
                  style={styles.ghostBtn}
                  onPress={() => Share.share({ message: question.bodyText ?? question.title })}
                >
                  <Icon name="copy" size={12} color={Colors.textMuted} />
                  <Text style={styles.ghostBtnText}>复制</Text>
                </Pressable>
              </View>
            </Card>
          </View>
        )}

        {/* ③ Mastery control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>掌握情况</Text>
          <Card style={styles.sectionCard}>
            <View style={styles.masteryGrid}>
              {MASTERY_OPTIONS.map((m) => {
                const active = mastery === m.k;
                return (
                  <Pressable
                    key={m.k}
                    style={[
                      styles.masteryBtn,
                      {
                        backgroundColor: active ? m.activeColor : m.bgColor,
                        borderColor: active ? m.activeColor : m.bgColor,
                      },
                    ]}
                    onPress={() => handleSetMastery(m.k)}
                  >
                    <Text
                      style={[
                        styles.masteryBtnText,
                        { color: active ? '#fff' : m.textColor },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.masteryHint}>
              {mastery ? MASTERY_HINT[mastery] : '标记后会更新你的弱点地图与推荐'}
            </Text>

            {/* 评价后：下一题 / 重选 */}
            {mastery && (
              <View style={styles.nextRow}>
                {nextQuestion ? (
                  <Pressable style={styles.nextBtn} onPress={goNext}>
                    <Text style={styles.nextBtnText}>下一题</Text>
                    <Icon name="forward" size={14} color="#fff" />
                  </Pressable>
                ) : (
                  <Text style={styles.masteryHint}>{listIds.length > 0 ? '列表已是最后一题 🎉' : '本科目题目已做完 🎉'}</Text>
                )}
                <Pressable style={styles.pickBtn} onPress={() => router.push('/search' as any)}>
                  <Icon name="grid" size={13} color={Colors.blue600} />
                  <Text style={styles.pickBtnText}>选题</Text>
                </Pressable>
              </View>
            )}
            {nextQuestion && mastery && (
              <Text style={styles.nextHint} numberOfLines={1}>
                下一题：{KAKOMON_UNIVERSITIES.find((u) => u.id === nextQuestion.universityId)?.short} {nextQuestion.year} · {nextQuestion.title}
              </Text>
            )}
          </Card>
        </View>

        {/* ③.5 同专题推荐（做完这道再练相关题） */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.accentBar, { backgroundColor: Colors.teal500 }]} />
                <Text style={styles.sectionTitle}>同专题练习</Text>
              </View>
              <Text style={styles.sectionMore}>{(question.knowledgePoints ?? [])[0] ?? '相关题'}</Text>
            </View>
            <View style={{ gap: 8 }}>
              {recommended.map((rq) => {
                const ru = KAKOMON_UNIVERSITIES.find((u) => u.id === rq.universityId)!;
                const racc = canAccessQuestion(user, { universityId: rq.universityId, gradSchool: rq.graduateSchool, year: rq.year, questionId: rq.id });
                return (
                  <Pressable
                    key={rq.id}
                    style={[styles.recCard, !racc.allowed && { opacity: 0.85 }]}
                    onPress={() => {
                      if (racc.allowed) router.replace(`/questions/${rq.id}` as any);
                      else router.push('/search' as any);
                    }}
                  >
                    <View style={styles.recTop}>
                      <Text style={styles.recUni}>{ru?.short} · {rq.year}</Text>
                      {!racc.allowed && (
                        <View style={styles.relatedLockBadge}>
                          <Icon name="lock" size={9} color={Colors.amber600} />
                          <Text style={styles.relatedLockText}>看广告</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.recTitle}>{rq.title}</Text>
                    <View style={styles.recTags}>
                      {(rq.knowledgePoints ?? []).slice(0, 3).map((k) => (
                        <View key={k} style={styles.recTag}>
                          <Text style={styles.recTagText}>#{k}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ④ Crowd difficulty calibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>众包难度校准</Text>
          <Card style={styles.sectionCard}>
            <Text style={styles.crowdDesc}>做完后投票，帮助下一位备考者：</Text>
            <View style={styles.crowdGrid}>
              {[
                { k: 'easy'   as CrowdVote, label: '简单', pct: easyPct,   activeColor: Colors.green500,  borderColor: Colors.green500  },
                { k: 'medium' as CrowdVote, label: '适中', pct: mediumPct, activeColor: Colors.amber500,  borderColor: Colors.amber500  },
                { k: 'hard'   as CrowdVote, label: '偏难', pct: hardPct,   activeColor: Colors.rose500,   borderColor: Colors.rose500   },
              ].map((v) => {
                const active = crowdVote === v.k;
                return (
                  <Pressable
                    key={v.k!}
                    style={[
                      styles.crowdBtn,
                      active
                        ? { borderColor: v.borderColor, backgroundColor: Colors.background }
                        : { borderColor: Colors.border },
                    ]}
                    onPress={() => setCrowdVote(v.k)}
                  >
                    <Text style={[styles.crowdBtnLabel, active && { color: v.activeColor }]}>{v.label}</Text>
                    <Text style={styles.crowdBtnPct}>{v.pct}%</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* ⑤ Standard explanation FREE */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>标准解析</Text>
            </View>
            <Badge variant="free" />
          </View>
          <Card style={styles.sectionCard}>
            {(question.standardExplanation ?? []).map((step, i) => (
              <View key={i} style={[styles.stepItem, i > 0 && styles.stepGap]}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            ))}
            {(question.standardExplanation ?? []).length === 0 && (
              <Text style={styles.emptyText}>解析整理中，敬请期待</Text>
            )}
          </Card>
        </View>

        {/* ⑥ Reference book matches FREE — MVP 阶段隐藏，代码保留供未来恢复 */}
        {SHOW_REFERENCE && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.accentBar, { backgroundColor: Colors.teal500 }]} />
              <Text style={styles.sectionTitle}>参考书对应章节</Text>
            </View>
            <Badge variant="free" />
          </View>
          {(question.referenceMatches ?? []).map((r) => (
            <Card key={r.id} style={[styles.sectionCard, styles.refCard]}>
              <View style={styles.refHeader}>
                <View style={styles.refIconWrap}>
                  <Icon name="book" size={16} color={Colors.teal600} />
                </View>
                <View style={styles.refMeta}>
                  <Text style={styles.refTitle} numberOfLines={1}>《{r.bookTitle}》</Text>
                  <Text style={styles.refChapter} numberOfLines={1}>{r.chapter}</Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>
                    {r.matchType === 'exact_question' ? '完全一致' : r.matchType === 'same_point' ? '同考点' : '相似解法'}
                  </Text>
                </View>
              </View>
              <Text style={styles.refSummary}>
                <Text style={styles.refPage}>{r.pageRange}</Text>
                {'　·　'}{r.rewrittenSummary}
              </Text>
              <View style={styles.refActions}>
                <Pressable
                  style={styles.ghostBtn}
                  onPress={() => Share.share({ message: r.pageRange })}
                >
                  <Icon name="copy" size={12} color={Colors.textMuted} />
                  <Text style={styles.ghostBtnText}>复制页码</Text>
                </Pressable>
              </View>
            </Card>
          ))}
          {(question.referenceMatches ?? []).length === 0 && (
            <Card style={styles.sectionCard}>
              <Text style={styles.emptyText}>参考书对应整理中</Text>
            </Card>
          )}
        </View>
        )}

        {/* ⑦ AI extended explanation PRO — MVP 阶段隐藏，代码保留供未来恢复 */}
        {SHOW_AI && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.accentBar, { backgroundColor: Colors.amber500 }]} />
              <Text style={styles.sectionTitle}>AI 扩展讲解</Text>
            </View>
            <Badge variant="pro" />
          </View>
          {isPro ? (
            <Card style={styles.sectionCard}>
              <View style={styles.aiUnlocked}>
                <Icon name="sparkles" size={14} color={Colors.amber500} />
                <Text style={styles.aiUnlockedText}>Pro 专属内容已解锁</Text>
              </View>
              <View style={styles.aiItem}>
                <Text style={styles.aiItemTitle}>为什么这题常出现在修考</Text>
                <Text style={styles.aiItemBody}>实对称矩阵的对角化是线代考查的核心套路，东大2019-2024共出现5次。本题是其中最完整的版本。</Text>
              </View>
              <View style={styles.aiItem}>
                <Text style={styles.aiItemTitle}>可迁移到哪些题型</Text>
                <Text style={styles.aiItemBody}>1. 数据降维 (PCA)；2. 线性回归正规方程；3. 量子力学厄米算符；4. 优化问题中的凸性判定</Text>
              </View>
              <View style={styles.aiItem}>
                <Text style={styles.aiItemTitle}>常见错误</Text>
                <Text style={styles.aiItemBody}>多数同学忽略 P 必须为正交矩阵，直接写 P⁻¹ 而忘了 Pᵀ = P⁻¹ 这个前提。</Text>
              </View>
            </Card>
          ) : (
            <Pressable
              style={styles.lockedCard}
              onPress={() => router.push('/paywall' as any)}
            >
              <View style={styles.lockedBlur}>
                <Icon name="crown" size={22} color={Colors.amber500} />
                <Text style={styles.lockedTitle}>深度解析需要解锁 Pro</Text>
                <View style={styles.upgradePillBtn}>
                  <Icon name="crown" size={12} color="#fff" />
                  <Text style={styles.upgradePillText}>升级 Pro 查看</Text>
                </View>
              </View>
            </Pressable>
          )}
        </View>
        )}

        {/* ⑧⑨⑩ Related questions (3 levels) */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.accentBar, { backgroundColor: Colors.indigo500 }]} />
              <Text style={styles.sectionTitle}>举一反三</Text>
            </View>
            <Text style={styles.sectionMore}>三级关联</Text>
          </View>

          {([
            { level: 1, items: lvl1 },
            { level: 2, items: lvl2 },
            { level: 3, items: lvl3 },
          ] as const).map(({ level, items }) => {
            const cfg = RELATED_LEVEL_COLORS[level];
            if (items.length === 0) return null;
            return (
              <View key={level} style={styles.relatedGroup}>
                <View style={styles.relatedHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.levelBadgeText, { color: cfg.text }]}>L{level}</Text>
                  </View>
                  <Text style={[styles.levelLabel, { color: cfg.text }]}>{cfg.label}</Text>
                  <Text style={styles.levelDesc}>{cfg.desc}</Text>
                </View>
                {items.map((r) => {
                  // 相似题推荐：跨校 / 超年份的题，按单题级广告解锁判定。
                  const access = canAccessQuestion(user, { universityId: r.universityId, gradSchool: graduateSchoolFor(r.id), year: r.year, questionId: r.id });
                  const locked = !access.allowed;
                  return (
                    <Pressable
                      key={r.id}
                      style={[styles.relatedCard, locked && { opacity: 0.85 }]}
                      onPress={() => {
                        if (locked) setRelatedGate(r);
                        else router.push(`/questions/${r.id}` as any);
                      }}
                    >
                      <View style={styles.relatedCardTop}>
                        <View style={styles.relatedCardMeta}>
                          <Text style={styles.relatedUni}>{r.universityName} · {r.year}</Text>
                          <Text style={styles.relatedQno}>{r.subject} {r.questionNo}</Text>
                        </View>
                        {locked ? (
                          <View style={styles.relatedLockBadge}>
                            <Icon name="lock" size={9} color={Colors.amber600} />
                            <Text style={styles.relatedLockText}>看广告</Text>
                          </View>
                        ) : (
                          <Text style={[styles.relatedConf, { color: cfg.text }]}>
                            {Math.round(r.confidence * 100)}% 匹配
                          </Text>
                        )}
                      </View>
                      <Text style={styles.relatedTitle}>{r.title}</Text>
                      <Text style={styles.relatedReason}>
                        {locked ? '看广告解锁这道相似题，或升级 Pro' : r.reason}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* ⑪ Forum discussion entry */}
        <View style={styles.section}>
          <Pressable
            style={styles.forumCard}
            onPress={() => router.push('/forum/t1' as any)}
          >
            <Icon name="message" size={16} color={Colors.indigo500} />
            <View style={styles.forumText}>
              <Text style={styles.forumTitle}>论坛 · 18 条相关讨论</Text>
              <Text style={styles.forumExcerpt}>最热：东大2024数学第3问，为什么一定可对角化？</Text>
            </View>
            <Icon name="chevronRight" size={16} color={Colors.indigo500} />
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Image viewer modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable style={styles.imageModalClose} onPress={() => setImageModalVisible(false)}>
            <Icon name="close" size={20} color="#fff" />
          </Pressable>
          <View style={styles.imageModalContent}>
            <Icon name="pageRef" size={48} color={Colors.textMuted} />
            <Text style={styles.imageModalLabel}>
              {university.short} {question.year} {question.subject} {question.questionNo}
            </Text>
            <Text style={styles.imageModalSub}>原版扫描图像</Text>
          </View>
        </View>
      </Modal>

      {/* Sticky bar：MVP 用论坛讨论替代 AI 提问（AI 按钮代码保留） */}
      <View style={styles.stickyBar}>
        {SHOW_AI ? (
          <>
            <Pressable style={styles.forumBtn} onPress={() => router.push('/forum/t1' as any)}>
              <Icon name="message" size={14} color={Colors.textSecondary} />
              <Text style={styles.forumBtnText}>论坛</Text>
            </Pressable>
            <Pressable
              style={styles.askAiBtn}
              onPress={() => router.push(`/ai-chat?questionId=${question.id}` as any)}
            >
              <Icon name="sparkles" size={14} color="#fff" />
              <Text style={styles.askAiBtnText}>问这道题</Text>
              <View style={styles.quotaBadge}>
                <Text style={styles.quotaBadgeText}>
                  {user.freeAiRemaining > 0 ? '免费 1/1' : '消耗 1 Token'}
                </Text>
              </View>
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.askAiBtn, { backgroundColor: Colors.indigo600 }]} onPress={() => router.push('/forum/t1' as any)}>
            <Icon name="message" size={14} color="#fff" />
            <Text style={styles.askAiBtnText}>去论坛讨论这道题</Text>
          </Pressable>
        )}
      </View>

      {relatedGate && (
        <AdGateModal
          open={!!relatedGate}
          onClose={() => setRelatedGate(null)}
          title={`解锁相似题 · ${relatedGate.universityName} ${relatedGate.year}`}
          desc="看广告解锁这一道跨校相似题，或升级 Pro 免广告解锁全部"
          onUnlock={() => {
            unlockQuestion(relatedGate.id);
            router.push(`/questions/${relatedGate.id}` as any);
          }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}

      {/* 「下一题」遇锁定题的广告闸：看广告解锁该大学×年份 24h，或升级 Pro */}
      {nextGate && (() => {
        const reason = canAccessQuestion(user, {
          universityId: nextGate.universityId, gradSchool: nextGate.graduateSchool, year: nextGate.year, questionId: nextGate.id,
        }).reason;
        const uniShort = KAKOMON_UNIVERSITIES.find((u) => u.id === nextGate.universityId)?.short ?? '该校';
        const listSuffix = listIds.length > 0 ? `?list=${listIds.join(',')}` : '';
        return (
          <AdGateModal
            open={!!nextGate}
            onClose={() => setNextGate(null)}
            title={`解锁 ${uniShort} ${nextGate.year}`}
            desc={reason === 'year'
              ? `看广告解锁 ${uniShort} ${nextGate.year} 年全部题目 · 24 小时，或升级 Pro`
              : `${uniShort} 该研究科不在免费 3 个研究科内，也可看广告解锁该大学 ${nextGate.year} 年题目 · 24 小时`}
            onUnlock={() => {
              unlockSchoolYear(nextGate.universityId, nextGate.year);
              router.replace(`/questions/${nextGate.id}${listSuffix}` as any);
            }}
            onUpgrade={() => router.push('/paywall' as any)}
          />
        );
      })()}
    </SafeAreaView>
  );
}
