import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPapers } from '@/api/papers';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { AdGateModal, Icon } from '@/components/ui';
import { DEMO_USER } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';
import { useAdStore } from '@/store/adStore';
import { canAccessQuestion } from '@/utils/accessPolicy';
import type { ExamPaper } from '@/types/question';

export default function ExamPapersScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ universityId: string; graduateSchool: string; majorId?: string; year: string; subjectCode: string; subjectName?: string }>();
  const { universityId, graduateSchool, subjectCode } = params;
  const majorId = params.majorId || null;
  const year = Number(params.year);
  const subjectName = params.subjectName ?? subjectCode;

  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const unlockSchoolYear = useAdStore((s) => s.unlockSchoolYear);
  useAdStore((s) => s.unlockedSchoolYears);

  const papersQuery = useQuery({
    queryKey: ['papers', universityId ?? '', graduateSchool ?? '', majorId ?? ''],
    queryFn: () => getPapers({ universityId, graduateSchool, majorId: majorId ?? undefined }),
    enabled: !!universityId && !!graduateSchool,
  });
  const papers: ExamPaper[] = useMemo(
    () => (papersQuery.data ?? []).filter((p) => p.year === year && p.subjectCode === subjectCode),
    [papersQuery.data, year, subjectCode],
  );

  const access = canAccessQuestion(user, { universityId, gradSchool: graduateSchool, year });
  const [gateOpen, setGateOpen] = useState(false);

  function openPaper(p: ExamPaper) {
    if (!access.allowed) { setGateOpen(true); return; }
    startPaper(p);
  }
  function startPaper(p: ExamPaper) {
    const dur = p.durationMinutes ? `&durationMinutes=${p.durationMinutes}` : '';
    const sel = p.selectRule ? `&selectTotal=${p.selectRule.total}&selectChoose=${p.selectRule.choose}` : '';
    const title = encodeURIComponent(`${year} ${subjectName}`);
    router.push(`/exam-session?paperCode=${encodeURIComponent(p.id)}&mode=mock&title=${title}${dur}${sel}` as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{year} 年度 · {subjectName}</Text>
          <Text style={styles.headerSub}>共 {papers.length} 份试卷</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {papersQuery.isLoading ? (
          <View style={styles.empty}><Text style={styles.emptyText}>加载中…</Text></View>
        ) : papersQuery.isError ? (
          <View style={styles.empty}><Icon name="clock" size={28} color={Colors.textMuted} /><Text style={styles.emptyText}>试卷加载失败，请重试</Text></View>
        ) : papers.length === 0 ? (
          <View style={styles.empty}><Icon name="clock" size={28} color={Colors.textMuted} /><Text style={styles.emptyText}>暂无试卷</Text></View>
        ) : (
          papers.map((p) => (
            <Pressable key={p.id} style={styles.paperCard} onPress={() => openPaper(p)}>
              <View style={styles.paperTop}>
                <Text style={styles.paperTitle} numberOfLines={2}>{p.title}</Text>
                {!access.allowed && <Icon name="eye" size={16} color={Colors.amber500} />}
              </View>
              <Text style={styles.paperMeta}>
                {p.durationMinutes ? `⏱ ${p.durationMinutes} 分` : ''}
                {p.selectRule ? `　·　${p.selectRule.total} 题选 ${p.selectRule.choose}` : ''}
                {`　·　${p.questionIds?.length ?? 0} 题`}
              </Text>
              <View style={styles.startRow}>
                <Text style={[styles.startText, { color: access.allowed ? Colors.indigo600 : Colors.amber600 }]}>
                  {access.allowed ? '开始做题 →' : '看广告解锁（24h）'}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
      {gateOpen && (
        <AdGateModal
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          title={`解锁 ${year} 年 ${subjectName}`}
          desc={`看广告解锁 ${year} 年题目 · 24 小时内有效`}
          onUnlock={() => { unlockSchoolYear(universityId, year); setGateOpen(false); }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },
  scroll: { padding: Spacing.cardPadding, gap: 10 },
  paperCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 8 },
  paperTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  paperTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  paperMeta: { fontSize: Typography.xs, color: c.textMuted },
  startRow: { marginTop: 2 },
  startText: { fontSize: Typography.sm, fontWeight: Typography.weightBold },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center' },
});
