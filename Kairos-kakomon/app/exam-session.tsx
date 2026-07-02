import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import QuestionBlocks from '@/components/study/QuestionBlocks';
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES } from '@/mocks/data';
import { useAttemptStore } from '@/store/attemptStore';
import type { ExamResult } from '@/types/attempt';
import type { KakomonQuestion } from '@/types/question';

type Phase = 'answer' | 'grade' | 'result';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  // progress dots
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.screenPadding, paddingVertical: 12 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.surfaceAlt },
  dotActive: { backgroundColor: c.indigo500 },
  dotDone: { backgroundColor: c.green500 },

  scroll: { padding: Spacing.screenPadding },

  // answer phase
  qIndex: { fontSize: Typography.xs, color: c.indigo500, fontWeight: Typography.weightBold, marginBottom: 6 },
  qMeta: { fontSize: Typography.xs, color: c.textMuted, marginBottom: 8 },
  qTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, marginBottom: 10, lineHeight: Typography.base * 1.35 },
  qBody: { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.6 },
  qBodyCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 6 },
  examHint: { fontSize: Typography.xs, color: c.textMuted, marginTop: 12, textAlign: 'center' },
  selectRuleHint: { fontSize: Typography.xs, color: c.amber500, textAlign: 'center', paddingHorizontal: Spacing.screenPadding, marginBottom: 4 },

  navRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  navBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: c.border },
  navBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  primaryBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: c.indigo600 },
  primaryBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },

  // grade phase
  gradeTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, marginBottom: 4 },
  gradeSub: { fontSize: Typography.xs, color: c.textMuted, marginBottom: Spacing.md },
  gradeCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 10, marginBottom: 10 },
  gradeQTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  gradeQMeta: { fontSize: Typography.xs, color: c.textMuted },
  gradeBtns: { flexDirection: 'row', gap: 8 },
  gradeBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  gradeBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },

  // result phase
  scoreCard: { alignItems: 'center', backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.lg, gap: 6, marginBottom: Spacing.md },
  scoreBig: { fontSize: 52, fontWeight: Typography.weightBold, letterSpacing: -1 },
  scoreLabel: { fontSize: Typography.sm, color: c.textSecondary },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  statCell: { flex: 1, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, alignItems: 'center', gap: 4 },
  statVal: { fontSize: Typography.xl, fontWeight: Typography.weightBold },
  statKey: { fontSize: Typography.xs, color: c.textMuted },
  doneBtn: { backgroundColor: c.indigo600, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
});

export default function ExamSessionScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; ids?: string; universityId?: string; mode?: string; durationMinutes?: string; selectTotal?: string; selectChoose?: string }>();
  const recordExamResult = useAttemptStore((s) => s.recordExamResult);

  const questions: KakomonQuestion[] = useMemo(() => {
    const ids = (params.ids ?? '').split(',').filter(Boolean);
    return ids
      .map((id) => KAKOMON_QUESTIONS.find((q) => q.id === id))
      .filter((q): q is KakomonQuestion => !!q);
  }, [params.ids]);

  const title = params.title ?? '模拟考试';
  const mode = (params.mode === 'topic' ? 'topic' : params.mode === 'custom' ? 'custom' : 'mock') as ExamResult['mode'];

  const durationMinutes = params.durationMinutes ? Number(params.durationMinutes) : null;
  const selectTotal = params.selectTotal ? Number(params.selectTotal) : null;
  const selectChoose = params.selectChoose ? Number(params.selectChoose) : null;

  const [phase, setPhase] = useState<Phase>('answer');
  const [idx, setIdx] = useState(0);
  // 自评结果：questionId → 是否做对
  const [grades, setGrades] = useState<Record<string, boolean>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const [remainingSec, setRemainingSec] = useState<number | null>(
    durationMinutes ? durationMinutes * 60 : null,
  );
  useEffect(() => {
    if (phase !== 'answer' || remainingSec === null) return;
    if (remainingSec <= 0) return;
    const t = setInterval(() => setRemainingSec((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [phase, remainingSec]);

  const clock = remainingSec === null
    ? null
    : `${String(Math.floor(remainingSec / 60)).padStart(2, '0')}:${String(remainingSec % 60).padStart(2, '0')}`;

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}><Text style={styles.headerTitle}>{title}</Text></View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textMuted }}>没有可用的题目</Text>
        </View>
      </SafeAreaView>
    );
  }

  const current = questions[idx];
  const correctCount = Object.values(grades).filter(Boolean).length;
  const gradedCount = Object.keys(grades).length;
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const scoreColor = score >= 80 ? Colors.green500 : score >= 60 ? Colors.amber500 : Colors.rose500;

  function finishAndSave() {
    const id = recordExamResult({
      mode,
      title,
      universityIds: params.universityId ? [params.universityId] : [],
      totalCount: questions.length,
      correctCount,
      score,
    });
    setSavedId(id);
    setPhase('result');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="close" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub}>
            {phase === 'answer'
              ? `答题中 · ${idx + 1}/${questions.length}${clock ? ` · ⏱ ${clock}` : ''}`
              : phase === 'grade' ? '自评批改' : '成绩'}
          </Text>
        </View>
      </View>

      {/* progress */}
      <View style={styles.progressRow}>
        {questions.map((q, i) => (
          <View
            key={q.id}
            style={[
              styles.dot,
              phase === 'answer' && i === idx && styles.dotActive,
              phase === 'answer' && i < idx && styles.dotDone,
              phase !== 'answer' && (grades[q.id] !== undefined ? styles.dotDone : styles.dotActive),
            ]}
          />
        ))}
      </View>

      {phase === 'answer' && selectTotal && selectChoose && (
        <Text style={styles.selectRuleHint}>本卷 {selectTotal} 题中任选 {selectChoose} 题作答</Text>
      )}

      {/* ── Answer phase ── */}
      {phase === 'answer' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.qIndex}>第 {idx + 1} 题 / 共 {questions.length} 题</Text>
          <Text style={styles.qMeta}>
            {KAKOMON_UNIVERSITIES.find((u) => u.id === current.universityId)?.short} {current.year} · {current.subject} {current.questionNo}
          </Text>
          <Text style={styles.qTitle}>{current.title}</Text>
          <View style={styles.qBodyCard}>
            <QuestionBlocks
              blocks={current.contentBlocks}
              fallbackText={current.bodyText ?? '（本题暂无题干文本，请参考原题图片作答。考试模式下不显示解析。）'}
            />
          </View>
          <Text style={styles.examHint}>考试模式：请在纸上作答，交卷后自行批改打分</Text>

          <View style={styles.navRow}>
            {idx > 0 && (
              <Pressable style={styles.navBtn} onPress={() => setIdx((i) => i - 1)}>
                <Text style={styles.navBtnText}>上一题</Text>
              </Pressable>
            )}
            {idx < questions.length - 1 ? (
              <Pressable style={styles.primaryBtn} onPress={() => setIdx((i) => i + 1)}>
                <Text style={styles.primaryBtnText}>下一题</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryBtn} onPress={() => setPhase('grade')}>
                <Text style={styles.primaryBtnText}>交卷 · 开始批改</Text>
              </Pressable>
            )}
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── Grade phase ── */}
      {phase === 'grade' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.gradeTitle}>自行批改</Text>
          <Text style={styles.gradeSub}>对照标准答案，给每道题判定对错。已评 {gradedCount}/{questions.length}</Text>
          {questions.map((q, i) => {
            const g = grades[q.id];
            return (
              <View key={q.id} style={styles.gradeCard}>
                <View>
                  <Text style={styles.gradeQTitle}>{i + 1}. {q.title}</Text>
                  <Text style={styles.gradeQMeta}>
                    {KAKOMON_UNIVERSITIES.find((u) => u.id === q.universityId)?.short} {q.year} · {q.questionNo}
                  </Text>
                </View>
                <View style={styles.gradeBtns}>
                  <Pressable
                    style={[styles.gradeBtn, { borderColor: g === true ? Colors.green500 : Colors.border, backgroundColor: g === true ? Colors.green500 : 'transparent' }]}
                    onPress={() => setGrades((p) => ({ ...p, [q.id]: true }))}
                  >
                    <Text style={[styles.gradeBtnText, { color: g === true ? '#fff' : Colors.green600 }]}>做对 ✓</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.gradeBtn, { borderColor: g === false ? Colors.rose500 : Colors.border, backgroundColor: g === false ? Colors.rose500 : 'transparent' }]}
                    onPress={() => setGrades((p) => ({ ...p, [q.id]: false }))}
                  >
                    <Text style={[styles.gradeBtnText, { color: g === false ? '#fff' : Colors.rose600 }]}>做错 ✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          <Pressable
            style={[styles.doneBtn, gradedCount < questions.length && { opacity: 0.5 }]}
            disabled={gradedCount < questions.length}
            onPress={finishAndSave}
          >
            <Text style={styles.doneBtnText}>{gradedCount < questions.length ? `还有 ${questions.length - gradedCount} 题未评` : '提交成绩'}</Text>
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── Result phase ── */}
      {phase === 'result' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreCard}>
            <Text style={[styles.scoreBig, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreLabel}>{title}</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: Colors.green500 }]}>{correctCount}</Text>
              <Text style={styles.statKey}>做对</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: Colors.rose500 }]}>{questions.length - correctCount}</Text>
              <Text style={styles.statKey}>做错</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: Colors.textPrimary }]}>{questions.length}</Text>
              <Text style={styles.statKey}>总题数</Text>
            </View>
          </View>
          <Text style={styles.examHint}>成绩已记入「我的」页成绩曲线{savedId ? '' : ''}</Text>
          <View style={{ height: 16 }} />
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>完成</Text>
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
