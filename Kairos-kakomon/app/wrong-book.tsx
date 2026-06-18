import { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card, Icon, ProgressBar, Segmented } from '@/components/ui';
import { KAKOMON_WRONG_QUESTIONS, KAKOMON_KNOWLEDGE_MATRIX } from '@/mocks/data';
import { recommendRelated } from '@/utils/recommend';
import type { KakomonQuestion } from '@/types/question';

type WrongQuestion = (typeof KAKOMON_WRONG_QUESTIONS)[number];

const SUBJECTS = ['全部', '线性代数', '微积分', '概率统计', '算法'];

function MasteryDots({ level, Colors }: { level: 0 | 1 | 2 | 3; Colors: ThemeColors }) {
  const dotColor = level <= 1 ? Colors.rose500 : level === 2 ? Colors.amber500 : Colors.green500;
  const dots = StyleSheet.create({
    row: { flexDirection: 'row', gap: 3 },
    dot: { width: 6, height: 6, borderRadius: 3 },
  });
  return (
    <View style={dots.row}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[dots.dot, { backgroundColor: i <= level ? dotColor : Colors.border }]}
        />
      ))}
    </View>
  );
}

type WrongCardProps = {
  w: WrongQuestion;
  reinforce: KakomonQuestion | undefined;
  Colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
  onOpen: (questionId: string) => void;
  onOpenReinforce: (questionId: string) => void;
};

function WrongCardImpl({ w, reinforce, Colors, styles, onOpen, onOpenReinforce }: WrongCardProps) {
  return (
    <View style={styles.wrongCard}>
      <Pressable onPress={() => onOpen(w.questionId)}>
        <View style={styles.wrongCardTop}>
          <View style={styles.wrongChips}>
            <View style={styles.roseChip}>
              <Text style={styles.roseChipText}>#{w.subject}</Text>
            </View>
            <View style={styles.outlinedChip}>
              <Text style={styles.outlinedChipText}>{w.point}</Text>
            </View>
          </View>
          <Text style={styles.wrongCount}>错 {w.wrongCount} 次</Text>
        </View>
        <Text style={styles.wrongTitle}>{w.title}</Text>
        <Text style={styles.wrongMeta}>{w.universityShort} · {w.year} · {w.questionNo}</Text>
        <View style={styles.wrongBottom}>
          <View style={styles.wrongBottomLeft}>
            <MasteryDots level={w.masteryLevel} Colors={Colors} />
            {w.tags.map((t) => (
              <View key={t} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.reviewDue}>
            <Icon name="bell" size={11} color={w.nextReviewAt === '今天' ? Colors.rose600 : Colors.textMuted} />
            <Text style={[styles.reviewDueText, w.nextReviewAt === '今天' && { color: Colors.rose500 }]}>
              {w.nextReviewAt}
            </Text>
          </View>
        </View>
      </Pressable>
      {reinforce && (
        <Pressable style={styles.reinforceBtn} onPress={() => onOpenReinforce(reinforce.id)}>
          <Icon name="target" size={12} color={Colors.indigo500} />
          <Text style={styles.reinforceText} numberOfLines={1}>
            加固练习：{reinforce.title}
          </Text>
          <Icon name="chevronRight" size={12} color={Colors.indigo500} />
        </Pressable>
      )}
    </View>
  );
}

const WrongCard = memo(WrongCardImpl);

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, paddingTop: 4, gap: 0 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  section: { marginBottom: Spacing.lg },

  statsCard: { padding: Spacing.cardPadding, gap: Spacing.sm },
  statsGrid: { flexDirection: 'row' },
  statCell: { flex: 1, gap: 2 },
  statLabel: { fontSize: Typography.xs, color: c.textMuted },
  statValue: { fontSize: Typography['2xl'], fontWeight: Typography.weightBold },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.rose500, borderRadius: 10, paddingVertical: 12, marginTop: 4 },
  reviewBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },

  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  filterChipActive: { backgroundColor: c.rose500 + '22', borderColor: c.rose500 },
  filterChipText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  filterChipTextActive: { color: c.rose500, fontWeight: Typography.weightSemibold },

  wrongCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 6, marginBottom: 8 },
  wrongCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wrongChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roseChip: { backgroundColor: c.rose500 + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  roseChipText: { fontSize: Typography.xs, color: c.rose500, fontWeight: Typography.weightMedium },
  outlinedChip: { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  outlinedChipText: { fontSize: Typography.xs, color: c.textSecondary },
  wrongCount: { fontSize: Typography.xs, color: c.textMuted, marginLeft: 'auto' },
  wrongTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, lineHeight: Typography.sm * 1.4 },
  wrongMeta: { fontSize: Typography.xs, color: c.textMuted },
  wrongBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  wrongBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagChip: { backgroundColor: c.amber500 + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagChipText: { fontSize: Typography.xs, color: c.amber500 },
  reviewDue: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewDueText: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted },
  reinforceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border },
  reinforceText: { flex: 1, fontSize: Typography.xs, color: c.indigo500, fontWeight: Typography.weightMedium },

  matrixCard: { padding: Spacing.cardPadding, gap: Spacing.sm, marginBottom: 10 },
  matrixHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matrixTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matrixBar: { width: 4, height: 16, borderRadius: 2 },
  matrixTitle: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  matrixTotal: { fontSize: Typography.xs, color: c.textMuted },
  matrixPoint: { gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border },
  matrixPointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matrixPointName: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  matrixPointMeta: { fontSize: Typography.xs, color: c.textMuted },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  overlapLabel: { fontSize: Typography.xs, color: c.textMuted },
  overlapChip: { backgroundColor: c.indigo600 + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  overlapChipText: { fontSize: Typography.xs, color: c.indigo500 },
  redoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingVertical: 8, marginTop: 4 },
  redoBtnText: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textSecondary },
});

export default function WrongBookScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const [tab, setTab] = useState<'list' | 'matrix'>('list');
  const [subject, setSubject] = useState('全部');

  const list = useMemo(
    () => KAKOMON_WRONG_QUESTIONS.filter((w) => subject === '全部' || w.subject === subject),
    [subject],
  );
  const listParam = useMemo(() => list.map((w) => w.questionId).join(','), [list]);

  // 一次性预算所有 reinforce 推荐，避免每次 render 对每个 item 都扫全表（O(N*M)）。
  const reinforceMap = useMemo(() => {
    const map = new Map<string, KakomonQuestion | undefined>();
    list.forEach((w) => {
      const r = recommendRelated({
        excludeQuestionId: w.questionId,
        knowledgePoints: [w.point, w.subject],
        subject: w.subject,
        limit: 1,
      })[0];
      map.set(w.id, r);
    });
    return map;
  }, [list]);

  const dueToday = useMemo(
    () => KAKOMON_WRONG_QUESTIONS.filter((w) => w.nextReviewAt === '今天').length,
    [],
  );
  const nearMastered = useMemo(
    () => KAKOMON_WRONG_QUESTIONS.filter((w) => w.masteryLevel === 2).length,
    [],
  );
  const todayList = useMemo(
    () => KAKOMON_WRONG_QUESTIONS.filter((w) => w.nextReviewAt === '今天'),
    [],
  );
  const todayParam = useMemo(() => todayList.map((w) => w.questionId).join(','), [todayList]);
  const notMastered = useMemo(
    () => KAKOMON_WRONG_QUESTIONS.filter((w) => w.masteryLevel <= 1).length,
    [],
  );

  const openWrong = useCallback(
    (questionId: string, ids: string) =>
      router.push(`/questions/${questionId}?list=${ids}` as any),
    [router],
  );

  const handleOpen = useCallback(
    (questionId: string) => openWrong(questionId, listParam),
    [openWrong, listParam],
  );
  const handleOpenReinforce = useCallback(
    (questionId: string) => router.push(`/questions/${questionId}` as any),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: WrongQuestion }) => (
      <WrongCard
        w={item}
        reinforce={reinforceMap.get(item.id)}
        Colors={Colors}
        styles={styles}
        onOpen={handleOpen}
        onOpenReinforce={handleOpenReinforce}
      />
    ),
    [reinforceMap, Colors, styles, handleOpen, handleOpenReinforce],
  );

  const keyExtractor = useCallback((item: WrongQuestion) => item.id, []);

  const StatsCard = (
    <View style={styles.section}>
      <Card style={styles.statsCard}>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>未掌握</Text>
            <Text style={[styles.statValue, { color: Colors.rose500 }]}>{notMastered}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>即将掌握</Text>
            <Text style={[styles.statValue, { color: Colors.amber500 }]}>{nearMastered}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>今日复习</Text>
            <Text style={[styles.statValue, { color: Colors.blue500 }]}>{dueToday}</Text>
          </View>
        </View>
        <Pressable
          style={styles.reviewBtn}
          onPress={() => {
            if (todayList[0]) openWrong(todayList[0].questionId, todayParam);
          }}
        >
          <Icon name="flame" size={14} color="#fff" />
          <Text style={styles.reviewBtnText}>开始今日复习（{dueToday} 题）</Text>
        </Pressable>
      </Card>
    </View>
  );

  const TabSwitcher = (
    <View style={styles.section}>
      <Segmented
        items={[{ value: 'list', label: '题目列表' }, { value: 'matrix', label: '知识点矩阵' }]}
        value={tab}
        onChange={(v) => setTab(v as 'list' | 'matrix')}
      />
    </View>
  );

  const SubjectFilter = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      style={styles.filterScroll}
    >
      {SUBJECTS.map((s) => (
        <Pressable
          key={s}
          style={[styles.filterChip, subject === s && styles.filterChipActive]}
          onPress={() => setSubject(s)}
        >
          <Text style={[styles.filterChipText, subject === s && styles.filterChipTextActive]}>
            {s}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>错题本</Text>
          <Text style={styles.headerSub}>{KAKOMON_WRONG_QUESTIONS.length} 道 · 今日待复习 {dueToday}</Text>
        </View>
        <Pressable
          style={styles.backBtn}
          onPress={() => Alert.alert('排序方式', '', [
            { text: '错误次数（从多到少）', onPress: () => {} },
            { text: '最近复习时间', onPress: () => {} },
            { text: '下次复习时间', onPress: () => {} },
            { text: '取消', style: 'cancel' },
          ])}
        >
          <Icon name="filter" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {tab === 'list' ? (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={
            <>
              {StatsCard}
              {TabSwitcher}
              {SubjectFilter}
              <View style={styles.section} />
            </>
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {StatsCard}
          {TabSwitcher}
          <View style={styles.section}>
            {KAKOMON_KNOWLEDGE_MATRIX.map((g) => (
              <Card key={g.subject} style={styles.matrixCard}>
                <View style={styles.matrixHeader}>
                  <View style={styles.matrixTitleRow}>
                    <View style={[styles.matrixBar, { backgroundColor: `${Colors[`${g.color}500` as keyof typeof Colors] ?? Colors.blue500}` }]} />
                    <Text style={styles.matrixTitle}>{g.subject}</Text>
                  </View>
                  <Text style={styles.matrixTotal}>共 {g.total} 错题</Text>
                </View>
                {g.points.map((p) => (
                  <View key={p.point} style={styles.matrixPoint}>
                    <View style={styles.matrixPointHeader}>
                      <Text style={styles.matrixPointName}>{p.point}</Text>
                      <Text style={styles.matrixPointMeta}>{p.count} 错 · 掌握 {Math.round(p.mastery * 100)}%</Text>
                    </View>
                    <ProgressBar
                      value={p.mastery * 100}
                      height={4}
                      color={p.mastery < 0.4 ? 'rose' : p.mastery < 0.7 ? 'amber' : 'teal'}
                    />
                    {p.overlap.length > 0 && (
                      <View style={styles.overlapRow}>
                        <Icon name="link" size={11} color={Colors.indigo500} />
                        <Text style={styles.overlapLabel}>目标校重叠：</Text>
                        {p.overlap.map((o) => (
                          <View key={o} style={styles.overlapChip}>
                            <Text style={styles.overlapChipText}>{o}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                <Pressable
                  style={styles.redoBtn}
                  onPress={() => {
                    const groupList = KAKOMON_WRONG_QUESTIONS.filter((w) => w.subject === g.subject);
                    if (groupList[0]) openWrong(groupList[0].questionId, groupList.map((w) => w.questionId).join(','));
                  }}
                >
                  <Icon name="flame" size={12} color={Colors.rose500} />
                  <Text style={styles.redoBtnText}>重做这一组（{g.total} 题）</Text>
                </Pressable>
              </Card>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
