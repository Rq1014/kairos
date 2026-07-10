import { useMemo, useState, useCallback } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/api/questions';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { AdGateModal, Icon } from '@/components/ui';
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';
import { useAdStore } from '@/store/adStore';
import type { KakomonQuestion } from '@/types/question';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, marginLeft: 4 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  list: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: 24 },

  card: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 10, gap: 6 },
  cardLocked: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  yearBadge: { backgroundColor: c.surfaceAlt, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  yearText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightSemibold },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uniText: { fontSize: Typography.xs, color: c.textMuted },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  diffText: { fontSize: 10, fontWeight: Typography.weightBold },
  kpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  kpChip: { backgroundColor: c.teal500 + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kpChipText: { fontSize: 10, color: c.teal600 },
  lockIcon: { marginLeft: 8 },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center' },
});

function diffColor(level: string | undefined, c: ThemeColors): { bg: string; fg: string } {
  switch (level) {
    case 'easy': return { bg: c.green500 + '22', fg: c.green600 };
    case 'medium': return { bg: c.blue500 + '22', fg: c.blue500 };
    case 'hard': return { bg: c.amber500 + '22', fg: c.amber500 };
    case 'very_hard': return { bg: c.rose500 + '22', fg: c.rose500 };
    default: return { bg: c.surfaceAlt, fg: c.textMuted };
  }
}

export default function TopicQuestionsScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ universityId: string; gradSchool: string; majorId: string; subjectCode: string }>();
  const unlockQuestion = useAdStore((s) => s.unlockQuestion);
  useAdStore((s) => s.unlockedQuestionIds);

  const { universityId, gradSchool, majorId, subjectCode } = params;
  const uni = KAKOMON_UNIVERSITIES.find((u) => u.id === universityId);

  const questionsQuery = useQuery({
    queryKey: ['questions', universityId, gradSchool, subjectCode],
    queryFn: () => getQuestions({
      universityIds: universityId ? [universityId] : undefined,
      subjects: subjectCode ? [subjectCode] : undefined,
      majorId: majorId || undefined,
      pageSize: 100,
    }),
    enabled: !!universityId && !!subjectCode,
  });

  // 后端已按 scope 过滤；前端只按 subjectCode 排序。
  const questions = useMemo(() => {
    const items = questionsQuery.data?.items ?? [];
    return items.filter((q) => q.subjectCode === subjectCode);
  }, [questionsQuery.data, subjectCode]);

  const [gate, setGate] = useState<KakomonQuestion | null>(null);

  const handlePress = useCallback((q: KakomonQuestion) => {
    if (!q.locked) {
      const ids = questions.map((x) => x.id).join(',');
      router.push(`/questions/${q.id}?list=${ids}` as any);
    } else {
      setGate(q);
    }
  }, [questions, router]);

  const renderItem = useCallback(({ item: q }: { item: KakomonQuestion }) => {
    const locked = !!q.locked;
    const dc = diffColor(q.difficultyLevel, Colors);
    return (
      <Pressable style={[styles.card, locked && styles.cardLocked]} onPress={() => handlePress(q)}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{q.title}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.uniText}>{q.subject} · {q.questionNo}</Text>
          {q.difficultyLabel && (
            <View style={[styles.diffBadge, { backgroundColor: dc.bg }]}>
              <Text style={[styles.diffText, { color: dc.fg }]}>{q.difficultyLabel}</Text>
            </View>
          )}
          {locked && <Icon name="eye" size={12} color={Colors.amber500} />}
        </View>
        <View style={styles.kpRow}>
          {(q.knowledgePoints ?? []).map((k) => (
            <View key={k} style={styles.kpChip}><Text style={styles.kpChipText}>{k}</Text></View>
          ))}
        </View>
      </Pressable>
    );
  }, [Colors, styles, handlePress]);

  const keyExtractor = useCallback((q: KakomonQuestion) => q.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{questionsQuery.data?.items?.[0]?.subject ?? subjectCode}</Text>
          <Text style={styles.headerSub}>{uni?.short ?? universityId} · {questions.length} 道题</Text>
        </View>
      </View>

      {questions.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="layers" size={28} color={Colors.textMuted} />
          <Text style={styles.emptyText}>暂无相关题目</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {gate && (
        <AdGateModal
          open={!!gate}
          onClose={() => setGate(null)}
          title="超出免费范围"
          desc="该题超出免费范围，看广告解锁"
          onUnlock={() => {
            unlockQuestion(gate.id);
            setGate(null);
            const ids = questions.map((x) => x.id).join(',');
            router.push(`/questions/${gate.id}?list=${ids}` as any);
          }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}
    </SafeAreaView>
  );
}
