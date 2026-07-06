import { useMemo } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/api/questions';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';
import { useAdStore } from '@/store/adStore';
import { AdGateModal } from '@/components/ui';
import { canAccessQuestion } from '@/utils/accessPolicy';
import { DEMO_USER } from '@/mocks/data';
import { useState, useCallback } from 'react';
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
  const params = useLocalSearchParams<{ universityId: string; gradSchool: string; majorId: string; subject: string }>();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const unlockSchoolYear = useAdStore((s) => s.unlockSchoolYear);
  useAdStore((s) => s.unlockedSchoolYears);

  const { universityId, gradSchool, majorId, subject } = params;
  const uni = KAKOMON_UNIVERSITIES.find((u) => u.id === universityId);

  const questionsQuery = useQuery({
    queryKey: ['questions', universityId, gradSchool, subject],
    queryFn: () => getQuestions({
      universityIds: universityId ? [universityId] : undefined,
      subjects: subject ? [subject] : undefined,
      pageSize: 100,
    }),
    enabled: !!universityId && !!subject,
  });

  // getQuestions 内部已带 mock 回退;这里再按 majorId 本地细筛 + 排序,兼容后端未按专业过滤。
  const questions = useMemo(() => {
    const items = questionsQuery.data?.items ?? [];
    return items
      .filter((q) => (gradSchool ? q.graduateSchool === gradSchool : true))
      .filter((q) => (majorId && q.majorIds && q.majorIds.length > 0 ? q.majorIds.includes(majorId) : true))
      .filter((q) => q.subject === subject)
      .sort((a, b) => b.year - a.year);
  }, [questionsQuery.data, gradSchool, majorId, subject]);

  const [gate, setGate] = useState<KakomonQuestion | null>(null);

  const handlePress = useCallback((q: KakomonQuestion) => {
    const access = canAccessQuestion(user, { universityId: q.universityId, gradSchool: q.graduateSchool, year: q.year, questionId: q.id });
    if (access.allowed) {
      const ids = questions.map((x) => x.id).join(',');
      router.push(`/questions/${q.id}?list=${ids}` as any);
    } else {
      setGate(q);
    }
  }, [user, questions]);

  const renderItem = useCallback(({ item: q }: { item: KakomonQuestion }) => {
    const access = canAccessQuestion(user, { universityId: q.universityId, gradSchool: q.graduateSchool, year: q.year, questionId: q.id });
    const locked = !access.allowed;
    const dc = diffColor(q.difficultyLevel, Colors);
    return (
      <Pressable style={[styles.card, locked && styles.cardLocked]} onPress={() => handlePress(q)}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{q.title}</Text>
          <View style={styles.yearBadge}><Text style={styles.yearText}>{q.year}</Text></View>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.uniText}>{uni?.short ?? universityId} · {q.questionNo}</Text>
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
  }, [user, Colors, styles, handlePress]);

  const keyExtractor = useCallback((q: KakomonQuestion) => q.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{subject}</Text>
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
          title={`解锁 ${uni?.short ?? ''} ${gate.year} 年题目`}
          desc={`看广告解锁 ${uni?.short ?? ''} ${gate.year} 年全部题目 · 24 小时内有效`}
          onUnlock={() => {
            unlockSchoolYear(gate.universityId, gate.year);
            setGate(null);
          }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}
    </SafeAreaView>
  );
}
