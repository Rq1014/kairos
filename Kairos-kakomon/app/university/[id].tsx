import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { KAKOMON_UNIVERSITIES, KAKOMON_QUESTIONS, KAKOMON_THREADS } from '@/mocks/data';
import type { ExamDifficulty } from '@/types/university';
import type { ThreadType } from '@/types/forum';

type Tab = '概览' | '过去问' | '评分' | '教授' | '论坛';
// MVP 阶段隐藏「教授」Tab（点开会出现问 AI 字样），未来恢复时加回 '教授'。代码保留。
const TABS: Tab[] = ['概览', '过去问', '评分', '论坛'];

const DIFFICULTY_LABEL: Record<ExamDifficulty, string> = {
  easy: '简单', medium: '中等', hard: '偏难', very_hard: '极难',
};

const THREAD_TYPE_LABELS: Record<ThreadType, { label: string; color: string }> = {
  question_discussion: { label: '题目讨论', color: '#3b82f6' },
  material_request:    { label: '资料互助', color: '#f59e0b' },
  experience:          { label: '合格经验', color: '#22c55e' },
  study_circle:        { label: '同校备考', color: '#6366f1' },
};

const MOCK_REVIEWS = [
  { name: 'Hiro', badge: '已合格', time: '3 周前', score: 4.5, text: '过去问透明度比想象中差，教授不会主动公开，需要找学长。但题目质量很高，刷透就能合格。' },
  { name: 'Ling', badge: '备考中', time: '1 个月前', score: 4.0, text: '数学难度上限偏高但可控，更看重解法套路熟练度。建议早点开始刷线代。' },
  { name: 'Yuki', badge: '已合格', time: '2 个月前', score: 4.8, text: '面试非常友好，研究计划书要认真准备。考试题目和过去问差异不大，押题准确率高。' },
];

const RATING_DIST = [
  { star: 5, count: 42, pct: 68 },
  { star: 4, count: 15, pct: 24 },
  { star: 3, count: 4,  pct: 6 },
  { star: 2, count: 1,  pct: 2 },
  { star: 1, count: 0,  pct: 0 },
];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: c.background },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:  { color: c.textMuted, fontSize: Typography.base },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub:    { fontSize: Typography.xs, color: c.textMuted },

  heroPad:   { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
  heroCard:  { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, padding: Spacing.cardPadding },
  heroRow:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroAvatar: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroAvatarText: { fontSize: 20, fontWeight: Typography.weightBold, color: '#fff' },
  heroInfo:  { flex: 1 },
  heroName:  { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
  heroSub:   { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  heroChips: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip:      { backgroundColor: c.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  chipText:  { fontSize: Typography.xs, color: c.textSecondary },
  rankChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  rankChipText: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: '#fff' },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
  statBox:   { alignItems: 'flex-start', gap: 2 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel:   { fontSize: Typography.xs, color: c.textMuted },
  statValue:   { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: c.textPrimary },

  tabScroll: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: c.border },
  tabRow:    { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding },
  tabItem:   { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: c.blue500 },
  tabText:       { fontSize: Typography.sm, color: c.textMuted, fontWeight: Typography.weightMedium },
  tabTextActive: { color: c.blue500, fontWeight: Typography.weightSemibold },

  scroll:   { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
  section:  { marginBottom: Spacing.md },
  sectionTitle:    { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  sectionSubLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted, marginBottom: 8 },
  card:     { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 10 },

  dimRow:      { gap: 6 },
  dimLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dimLabel:    { fontSize: Typography.xs, fontWeight: Typography.weightMedium, color: c.textSecondary },
  dimNum:      { fontSize: Typography.xs, color: c.textMuted },
  dimTrack:    { height: 6, backgroundColor: c.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  dimFill:     { height: 6, borderRadius: 3 },


  similarRow:  { flexDirection: 'row', gap: 8 },
  similarCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: 12, width: 140, gap: 4 },
  similarName: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  similarSub:  { fontSize: Typography.xs, color: c.textMuted },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText:  { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  browseAll:      { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  browseAllTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  browseAllSub:   { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },

  qCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 6, marginBottom: 8 },
  qCardMeta: { flexDirection: 'row', gap: 8 },
  qYear:    { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted },
  qSubject: { fontSize: Typography.xs, color: c.textMuted },
  qTitle:   { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  kpRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  kpChip:   { borderWidth: 1, borderColor: c.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kpChipText: { fontSize: Typography.xs, color: c.textSecondary },

  // Rating summary card
  ratingSummary: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 12 },
  ratingMain: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  ratingScore: { alignItems: 'center', gap: 2 },
  ratingScoreNum: { fontSize: 40, fontWeight: Typography.weightBold, color: c.textPrimary, letterSpacing: -1 },
  ratingStars: { flexDirection: 'row', gap: 2 },
  ratingTotal: { fontSize: Typography.xs, color: c.textMuted },
  ratingBars: { flex: 1, gap: 4 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBarLabel: { fontSize: Typography.xs, color: c.textMuted, width: 8, textAlign: 'right' },
  ratingBarTrack: { flex: 1, height: 6, backgroundColor: c.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: 6, borderRadius: 3, backgroundColor: c.amber500 },
  ratingBarCount: { fontSize: Typography.xs, color: c.textMuted, width: 22, textAlign: 'right' },

  // Review cards
  reviewCard:      { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 8 },
  reviewHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewAvatar:    { width: 32, height: 32, borderRadius: 16, backgroundColor: c.blue500, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 13, fontWeight: Typography.weightBold, color: '#fff' },
  reviewNameCol:   { gap: 2 },
  reviewName:      { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  reviewBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  reviewBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  reviewScoreRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewScoreText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  reviewText:      { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.6 },
  reviewTime:      { fontSize: Typography.xs, color: c.textMuted, marginTop: 6 },
  writeReviewBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.blue500, borderRadius: Spacing.cardRadius, paddingVertical: 12, marginTop: 4 },
  writeReviewText: { fontSize: Typography.sm, color: c.blue500, fontWeight: Typography.weightSemibold },

  profCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 8, marginBottom: 8 },
  profRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profAvatar:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profAvatarText: { fontSize: 14, fontWeight: Typography.weightBold, color: '#fff' },
  profInfo:    { flex: 1 },
  profName:    { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  profLab:     { fontSize: Typography.xs, color: c.textMuted },
  profRight:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profReviewCount: { fontSize: Typography.xs, color: c.textMuted },
  profDirection: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.6 },
  profTags:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  profChip:    { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  profChipText: { fontSize: Typography.xs, color: c.textSecondary },

  threadCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 8 },
  threadMeta:    { flexDirection: 'row', gap: 6, marginBottom: 6 },
  threadTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  threadTypeText:  { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  threadTitle:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, lineHeight: Typography.sm * 1.4 },
  threadExcerpt:   { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.5, marginTop: 4 },
  threadFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  threadFooterText: { fontSize: Typography.xs, color: c.textMuted },
  threadStats:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  threadStatNum:   { fontSize: Typography.xs, color: c.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText:  { fontSize: Typography.sm, color: c.textMuted },

  // 雷达图卡片
  radarCard:   { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, alignItems: 'center' },
  radarHint:   { fontSize: Typography.xs, color: c.textMuted, marginTop: 6, textAlign: 'center' },
  rateBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: c.amber500, borderRadius: Spacing.cardRadius, paddingVertical: 12, marginTop: 10 },
  rateBtnText: { fontSize: Typography.sm, color: c.amber600, fontWeight: Typography.weightSemibold },

  // 打分弹窗
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: c.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 32 },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  modalTitle:   { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, marginBottom: 4 },
  modalSub:     { fontSize: Typography.xs, color: c.textMuted, marginBottom: 12 },
  rateRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rateRowLabel: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.weightMedium },
  submitBtn:    { backgroundColor: c.amber500, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  submitBtnText:{ fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
});

function StarRow({ score, size = 12 }: { score: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          color={i <= Math.round(score) ? '#f59e0b' : '#94a3b8'}
        />
      ))}
    </View>
  );
}

function StatBox({ icon, value, label, color, styles }: { icon: string; value: string | number; label: string; color: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIconRow}>
        <Icon name={icon as any} size={12} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/** 维度评分 0-100 → 5 分制。 */
const to5 = (v: number) => Math.round((v / 20) * 10) / 10;

/** 六维雷达图（5 分制）。size 为正方形边长。 */
function RadarChart({
  data, accent, gridColor, labelColor, size = 220, max = 5,
}: {
  data: { label: string; value: number }[];
  accent: string;
  gridColor: string;
  labelColor: string;
  size?: number;
  max?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34; // 留出标签空间
  const n = data.length;
  const angleAt = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angleAt(i)),
    y: cy + radius * Math.sin(angleAt(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = data
    .map((d, i) => {
      const p = point(i, r * Math.min(d.value / max, 1));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <Svg width={size} height={size}>
      {/* 网格环 */}
      {rings.map((ring) => (
        <Polygon
          key={ring}
          points={data.map((_, i) => { const p = point(i, r * ring); return `${p.x},${p.y}`; }).join(' ')}
          fill="none"
          stroke={gridColor}
          strokeWidth={1}
        />
      ))}
      {/* 轴线 */}
      {data.map((_, i) => {
        const p = point(i, r);
        return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={gridColor} strokeWidth={1} />;
      })}
      {/* 数据多边形 */}
      <Polygon points={polygon} fill={accent + '33'} stroke={accent} strokeWidth={2} />
      {data.map((d, i) => {
        const p = point(i, r * Math.min(d.value / max, 1));
        return <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={accent} />;
      })}
      {/* 维度标签 + 分数 */}
      {data.map((d, i) => {
        const p = point(i, r + 18);
        return (
          <SvgText
            key={i}
            x={p.x}
            y={p.y}
            fill={labelColor}
            fontSize={10}
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {`${d.label} ${d.value.toFixed(1)}`}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={4}>
          <Icon name="star" size={22} color={i <= value ? '#f59e0b' : '#cbd5e1'} />
        </Pressable>
      ))}
    </View>
  );
}

export default function UniversityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [tab, setTab] = useState<Tab>('概览');

  // 个人打分（5 分制，通用维度）。
  const [rateOpen, setRateOpen] = useState(false);
  const [myScores, setMyScores] = useState<Record<string, number>>({});

  const ACCENT_500: Record<string, string> = {
    blue:   Colors.blue500,
    teal:   Colors.teal500,
    indigo: Colors.indigo500,
    amber:  Colors.amber500,
    rose:   Colors.rose500,
  };

  const u = KAKOMON_UNIVERSITIES.find((x) => x.id === id);
  if (!u) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>大学数据未找到</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent500 = ACCENT_500[u.accent] ?? Colors.blue500;
  const uniQuestions = KAKOMON_QUESTIONS.filter((q) => q.universityId === u.id);
  const uniThreads   = KAKOMON_THREADS.filter((t) => t.universityId === u.id);
  const avgScore = (MOCK_REVIEWS.reduce((s, r) => s + r.score, 0) / MOCK_REVIEWS.length).toFixed(1);

  // 六维评分（5 分制），用于雷达图。
  const radarData = Object.entries(u.dimensions).map(([label, v]) => ({ label, value: to5(v) }));

  function submitMyRating() {
    setRateOpen(false);
    Alert.alert('已提交', '感谢你的评分！数据将在汇总后展示。', [{ text: '好的' }]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{u.nameCn}</Text>
          <Text style={styles.headerSub}>{u.nameJp}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Hero card */}
      <View style={styles.heroPad}>
        <View style={[styles.heroCard, { borderColor: accent500 + '44' }]}>
          <View style={styles.heroRow}>
            <View style={[styles.heroAvatar, { backgroundColor: accent500 }]}>
              <Text style={styles.heroAvatarText}>{u.short.slice(0, 1)}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{u.nameCn}</Text>
              <Text style={styles.heroSub}>{u.nameJp} · {u.nameEn}</Text>
              <View style={styles.heroChips}>
                <View style={styles.chip}><Text style={styles.chipText}>{u.type === 'national' ? '国立' : '私立'}</Text></View>
                <View style={styles.chip}><Text style={styles.chipText}>{u.region}</Text></View>
                <View style={[styles.chip, { backgroundColor: Colors.rose50 }]}>
                  <Text style={[styles.chipText, { color: Colors.rose600 }]}>{DIFFICULTY_LABEL[u.examDifficulty]}</Text>
                </View>
                {u.qsRank && (
                  <View style={[styles.rankChip, { backgroundColor: Colors.indigo600 }]}>
                    <Text style={styles.rankChipText}>QS #{u.qsRank}</Text>
                  </View>
                )}
                {u.domesticRank && (
                  <View style={[styles.rankChip, { backgroundColor: Colors.teal600 }]}>
                    <Text style={styles.rankChipText}>国内 #{u.domesticRank}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.heroStats}>
            <StatBox icon="star"    value={u.rating.toFixed(1)} label="综合评分" color={Colors.amber500} styles={styles} />
            <StatBox icon="book"    value={u.pastExamCount}     label="过去问"   color={accent500} styles={styles} />
            <StatBox icon="message" value={u.reviewCount}       label="评价"     color={Colors.indigo500} styles={styles} />
            {u.qsRank && <StatBox icon="star" value={`#${u.qsRank}`} label="QS排名" color={Colors.indigo500} styles={styles} />}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        style={styles.tabScroll}
      >
        {TABS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tabItem, tab === t && styles.tabItemActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 概览 ── */}
        {tab === '概览' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>修考难度评分</Text>
              <View style={styles.radarCard}>
                <RadarChart
                  data={radarData}
                  accent={accent500}
                  gridColor={Colors.border}
                  labelColor={Colors.textSecondary}
                />
                <Text style={styles.radarHint}>满分 5 分 · 综合 {u.reviewCount} 条评价</Text>
                <Pressable style={styles.rateBtn} onPress={() => setRateOpen(true)}>
                  <Icon name="star" size={14} color={Colors.amber600} />
                  <Text style={styles.rateBtnText}>给这所学校打分</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>热门科目分布</Text>
              <View style={styles.card}>
                {[
                  { s: '数学',  c: 124, pct: 90 },
                  { s: '情报',  c: 88,  pct: 64 },
                  { s: '物理',  c: 56,  pct: 41 },
                  { s: '英语',  c: 44,  pct: 32 },
                ].map((x) => (
                  <View key={x.s} style={styles.dimRow}>
                    <View style={styles.dimLabelRow}>
                      <Text style={styles.dimLabel}>{x.s}</Text>
                      <Text style={styles.dimNum}>{x.c} 题</Text>
                    </View>
                    <View style={styles.dimTrack}>
                      <View style={[styles.dimFill, { width: `${x.pct}%`, backgroundColor: accent500 }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>相似学校</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
                {KAKOMON_UNIVERSITIES.filter((x) => x.id !== u.id).slice(0, 4).map((x) => (
                  <Pressable
                    key={x.id}
                    style={styles.similarCard}
                    onPress={() => router.push(`/university/${x.id}` as any)}
                  >
                    <Text style={styles.similarName}>{x.short}</Text>
                    <Text style={styles.similarSub}>{x.nameJp}</Text>
                    <View style={styles.ratingRow}>
                      <Icon name="star" size={11} color={Colors.amber500} />
                      <Text style={styles.ratingText}>{x.rating.toFixed(1)}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* ── 过去问 ── */}
        {tab === '过去问' && (
          <>
            <View style={styles.section}>
              <Pressable style={styles.browseAll} onPress={() => router.push('/search' as any)}>
                <View>
                  <Text style={styles.browseAllTitle}>浏览全部 {u.pastExamCount} 道题目</Text>
                  <Text style={styles.browseAllSub}>2014-2024 · 按年份 / 科目筛选</Text>
                </View>
                <Icon name="chevronRight" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionSubLabel}>最热</Text>
              {(uniQuestions.length > 0 ? uniQuestions : KAKOMON_QUESTIONS).slice(0, 4).map((q) => (
                <Pressable
                  key={q.id}
                  style={styles.qCard}
                  onPress={() => router.push(`/questions/${q.id}` as any)}
                >
                  <View style={styles.qCardMeta}>
                    <Text style={styles.qYear}>{q.year}</Text>
                    <Text style={styles.qSubject}>{q.subject} · {q.questionNo}</Text>
                  </View>
                  <Text style={styles.qTitle}>{q.title}</Text>
                  {q.knowledgePoints && (
                    <View style={styles.kpRow}>
                      {q.knowledgePoints.slice(0, 2).map((k) => (
                        <View key={k} style={styles.kpChip}>
                          <Text style={styles.kpChipText}>{k}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ── 评分 ── */}
        {tab === '评分' && (
          <>
            {/* Rating summary */}
            <View style={styles.section}>
              <View style={styles.ratingSummary}>
                <View style={styles.ratingMain}>
                  <View style={styles.ratingScore}>
                    <Text style={styles.ratingScoreNum}>{avgScore}</Text>
                    <StarRow score={parseFloat(avgScore)} size={14} />
                    <Text style={styles.ratingTotal}>{MOCK_REVIEWS.length} 条评价</Text>
                  </View>
                  <View style={styles.ratingBars}>
                    {RATING_DIST.map((d) => (
                      <View key={d.star} style={styles.ratingBarRow}>
                        <Text style={styles.ratingBarLabel}>{d.star}</Text>
                        <View style={styles.ratingBarTrack}>
                          <View style={[styles.ratingBarFill, { width: `${d.pct}%` }]} />
                        </View>
                        <Text style={styles.ratingBarCount}>{d.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Dimension scores — 雷达图（5 分制） */}
            <View style={styles.section}>
              <View style={styles.radarCard}>
                <RadarChart
                  data={radarData}
                  accent={accent500}
                  gridColor={Colors.border}
                  labelColor={Colors.textSecondary}
                />
                <Text style={styles.radarHint}>满分 5 分 · 6 个通用维度</Text>
                <Pressable style={styles.rateBtn} onPress={() => setRateOpen(true)}>
                  <Icon name="star" size={14} color={Colors.amber600} />
                  <Text style={styles.rateBtnText}>给这所学校打分</Text>
                </Pressable>
              </View>
            </View>

            {/* User reviews */}
            <View style={styles.section}>
              <Text style={styles.sectionSubLabel}>用户评价</Text>
              {MOCK_REVIEWS.map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthorRow}>
                      <View style={[styles.reviewAvatar, { backgroundColor: accent500 }]}>
                        <Text style={styles.reviewAvatarText}>{r.name.slice(0, 1)}</Text>
                      </View>
                      <View style={styles.reviewNameCol}>
                        <Text style={styles.reviewName}>{r.name}</Text>
                        <View style={[styles.reviewBadge, { backgroundColor: r.badge === '已合格' ? Colors.green50 : Colors.amber50 }]}>
                          <Text style={[styles.reviewBadgeText, { color: r.badge === '已合格' ? Colors.green600 : Colors.amber600 }]}>{r.badge}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.reviewScoreRow}>
                      <StarRow score={r.score} size={12} />
                      <Text style={styles.reviewScoreText}>{r.score}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                  <Text style={styles.reviewTime}>{r.time}</Text>
                </View>
              ))}
              <Pressable
                style={styles.writeReviewBtn}
                onPress={() => Alert.alert('写评价', '评价功能即将上线，感谢你的支持！', [{ text: '好的' }])}
              >
                <Icon name="edit" size={14} color={Colors.blue500} />
                <Text style={styles.writeReviewText}>写一条评价</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ── 教授 ── */}
        {tab === '教授' && (
          <View style={styles.section}>
            {u.professorHighlights.length > 0 ? (
              u.professorHighlights.map((p, i) => (
                <Pressable
                  key={i}
                  style={styles.profCard}
                  onPress={() => router.push(`/professor/${encodeURIComponent(p.name)}?universityId=${u.id}` as any)}
                >
                  <View style={styles.profRow}>
                    <View style={[styles.profAvatar, { backgroundColor: accent500 }]}>
                      <Text style={styles.profAvatarText}>{p.name.slice(0, 1)}</Text>
                    </View>
                    <View style={styles.profInfo}>
                      <Text style={styles.profName}>{p.name}</Text>
                      <Text style={styles.profLab}>{p.lab}</Text>
                    </View>
                    <View style={styles.profRight}>
                      <Text style={styles.profReviewCount}>{p.reviewCount} 评</Text>
                      <Icon name="chevronRight" size={14} color={Colors.textMuted} />
                    </View>
                  </View>
                  <Text style={styles.profDirection}>研究方向：{p.direction}</Text>
                  <View style={styles.profTags}>
                    <View style={styles.profChip}><Text style={styles.profChipText}>考试相关：高</Text></View>
                    <View style={styles.profChip}><Text style={styles.profChipText}>面试友好</Text></View>
                    <View style={[styles.profChip, { backgroundColor: Colors.teal50, borderColor: Colors.teal500 + '44' }]}>
                      <Icon name="sparkles" size={10} color={Colors.teal500} />
                      <Text style={[styles.profChipText, { color: Colors.teal500 }]}>AI 总结</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="user" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>该校教授信息正在收集中</Text>
              </View>
            )}
          </View>
        )}

        {/* ── 论坛 ── */}
        {tab === '论坛' && (
          <View style={styles.section}>
            {(uniThreads.length > 0 ? uniThreads : KAKOMON_THREADS).slice(0, 4).map((t) => {
              const typeInfo = THREAD_TYPE_LABELS[t.type];
              return (
                <Pressable
                  key={t.id}
                  style={styles.threadCard}
                  onPress={() => router.push(`/forum/${t.id}` as any)}
                >
                  <View style={styles.threadMeta}>
                    <View style={[styles.threadTypeBadge, { backgroundColor: typeInfo.color + '22' }]}>
                      <Text style={[styles.threadTypeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                    </View>
                    {t.hasAcceptedAnswer && (
                      <View style={[styles.threadTypeBadge, { backgroundColor: Colors.green50 }]}>
                        <Text style={[styles.threadTypeText, { color: Colors.green600 }]}>✓ 已采纳</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.threadTitle}>{t.title}</Text>
                  <Text style={styles.threadExcerpt} numberOfLines={2}>{t.excerpt}</Text>
                  <View style={styles.threadFooter}>
                    <Text style={styles.threadFooterText}>{t.authorName.split(' · ')[1] ?? t.authorName}</Text>
                    <View style={styles.threadStats}>
                      <Icon name="message" size={11} color={Colors.textMuted} />
                      <Text style={styles.threadStatNum}>{t.replyCount}</Text>
                      <Icon name="eye" size={11} color={Colors.textMuted} />
                      <Text style={styles.threadStatNum}>{t.viewCount}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 个人打分弹窗（5 分制，6 个通用维度） */}
      <Modal visible={rateOpen} transparent animationType="slide" onRequestClose={() => setRateOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRateOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>给 {u.nameCn} 打分</Text>
            <Text style={styles.modalSub}>满分 5 分 · 你的评分会汇入综合雷达图</Text>
            {Object.keys(u.dimensions).map((dim) => (
              <View key={dim} style={styles.rateRow}>
                <Text style={styles.rateRowLabel}>{dim}</Text>
                <StarInput
                  value={myScores[dim] ?? 0}
                  onChange={(v) => setMyScores((prev) => ({ ...prev, [dim]: v }))}
                />
              </View>
            ))}
            <Pressable style={styles.submitBtn} onPress={submitMyRating}>
              <Text style={styles.submitBtnText}>提交评分</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
