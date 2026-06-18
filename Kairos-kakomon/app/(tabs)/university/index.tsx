import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FlatList,
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
import { Icon } from '@/components/ui';
import { getUniversities } from '@/api/universities';
import { KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';
import type { University, ExamDifficulty } from '@/types/university';

const FILTERS = ['全部', '国立', '私立', '理工', '文商', '关东', '关西', '热门'];
type SortKey = '综合评分' | 'QS排名' | '国内排名' | '过去问数量';
const SORT_CYCLE: SortKey[] = ['综合评分', 'QS排名', '国内排名', '过去问数量'];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: c.background },
  listContent: { paddingHorizontal: Spacing.screenPadding, paddingTop: 4 },

  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  title:    { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: c.textPrimary },
  subtitle: { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },

  filterScroll: { marginTop: 10 },
  filterRow:   { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  filterChipActive: { backgroundColor: c.blue500 + '22', borderColor: c.blue500 },
  filterChipText:       { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  filterChipTextActive: { color: c.blue500, fontWeight: Typography.weightSemibold },

  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  countText: { fontSize: Typography.sm, color: c.textMuted },
  sortRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText:  { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightSemibold },

  card: {
    backgroundColor: c.surface,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 10,
  },
  cardPad:  { padding: Spacing.cardPadding },
  cardRow:  { flexDirection: 'row', gap: 12, alignItems: 'center' },
  uniAvatar: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  uniAvatarText: { fontSize: 16, fontWeight: Typography.weightBold, color: '#fff' },
  cardInfo:    { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName:    { fontSize: Typography.md, fontWeight: Typography.weightSemibold, color: c.textPrimary, flex: 1 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 },
  ratingText:  { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  cardSubName: { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },

  divider: { height: 1, backgroundColor: c.border, marginVertical: 10 },

  statsRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  statItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:    { fontSize: 11, color: c.textSecondary },
  statNum:     { fontWeight: Typography.weightBold, color: c.textPrimary },

  diffBadge:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  diffBadgeText: { fontSize: 10, fontWeight: Typography.weightSemibold },
  rankBadge:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: c.indigo50 },
  rankBadgeDomestic: { backgroundColor: c.teal50 },
  rankBadgeText: { fontSize: 10, fontWeight: Typography.weightSemibold, color: c.indigo500 },

  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  subjectChip:   { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  subjectChipText: { fontSize: Typography.xs, color: c.textSecondary },

  targetBanner:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, padding: 8, marginTop: 10 },
  targetBannerText: { fontSize: 11, fontWeight: Typography.weightSemibold },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText:  { fontSize: Typography.base, color: c.textSecondary, fontWeight: Typography.weightMedium },
});

function DifficultyBadge({ level }: { level: ExamDifficulty }) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const DIFFICULTY_COLORS: Record<ExamDifficulty, { bg: string; text: string; label: string }> = {
    easy:      { bg: Colors.green50,  text: Colors.green600,  label: '简单' },
    medium:    { bg: Colors.amber50,  text: Colors.amber600,  label: '中等' },
    hard:      { bg: Colors.rose50,   text: Colors.rose600,   label: '偏难' },
    very_hard: { bg: Colors.rose50,   text: Colors.rose500,   label: '极难' },
  };

  const c = DIFFICULTY_COLORS[level];
  return (
    <View style={[styles.diffBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.diffBadgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function UniversityCard({ u, isTarget, onPress }: { u: University; isTarget: boolean; onPress: () => void }) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const ACCENT_500: Record<string, string> = {
    blue:   Colors.blue500,
    teal:   Colors.teal500,
    indigo: Colors.indigo500,
    amber:  Colors.amber500,
    rose:   Colors.rose500,
  };
  const ACCENT_50: Record<string, string> = {
    blue:   Colors.blue50,
    teal:   Colors.teal50,
    indigo: Colors.indigo50,
    amber:  Colors.amber50,
    rose:   Colors.rose50,
  };

  const accent500 = ACCENT_500[u.accent] ?? Colors.blue500;
  const accent50  = ACCENT_50[u.accent]  ?? Colors.blue50;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardPad}>
        <View style={styles.cardRow}>
          <View style={[styles.uniAvatar, { backgroundColor: accent500 }]}>
            <Text style={styles.uniAvatarText}>{u.short.slice(0, 1)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardName} numberOfLines={1}>{u.nameCn}</Text>
              <View style={styles.ratingRow}>
                <Icon name="star" size={12} color={Colors.amber500} />
                <Text style={styles.ratingText}>{u.rating.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.cardSubName} numberOfLines={1}>{u.nameJp} · {u.nameEn}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="book" size={11} color={Colors.textMuted} />
            <Text style={styles.statText}>过去问 <Text style={styles.statNum}>{u.pastExamCount}</Text></Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="message" size={11} color={Colors.textMuted} />
            <Text style={styles.statText}>评价 <Text style={styles.statNum}>{u.reviewCount}</Text></Text>
          </View>
          <DifficultyBadge level={u.examDifficulty} />
          {u.qsRank && (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>QS #{u.qsRank}</Text>
            </View>
          )}
          {!u.qsRank && u.domesticRank && (
            <View style={[styles.rankBadge, styles.rankBadgeDomestic]}>
              <Text style={styles.rankBadgeText}>国内 #{u.domesticRank}</Text>
            </View>
          )}
        </View>

        <View style={styles.tagsRow}>
          {u.hotSubjects.map((s) => (
            <View key={s} style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>{s}</Text>
            </View>
          ))}
        </View>

        {isTarget && (
          <View style={[styles.targetBanner, { backgroundColor: accent50 }]}>
            <Icon name="trending" size={11} color={accent500} />
            <Text style={[styles.targetBannerText, { color: accent500 }]}>
              你的目标校
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function UniversityScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const targetIds = useMemo(
    () => new Set((user.targetSchools ?? []).map((s) => s.universityId)),
    [user.targetSchools],
  );
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('全部');
  const [sortIdx, setSortIdx] = useState(0);
  const sort = SORT_CYCLE[sortIdx];

  const universitiesQuery = useQuery({
    queryKey: ['universities', 'list'],
    queryFn: () => getUniversities({ page: 1, pageSize: 100 }),
  });
  const universities = universitiesQuery.data?.items?.length
    ? universitiesQuery.data.items
    : KAKOMON_UNIVERSITIES;

  const list = useMemo(() => {
    const filtered = universities.filter((u) => {
      if (filter === '国立') return u.type === 'national';
      if (filter === '私立') return u.type === 'private';
      if (filter === '理工') return u.tags.includes('理工');
      if (filter === '文商') return u.tags.includes('文商');
      if (filter === '关东') return u.region === '关东';
      if (filter === '关西') return u.region === '关西';
      if (filter === '热门') return u.tags.includes('热门');
      return true;
    }).filter((u) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        u.nameCn.includes(search) ||
        u.nameJp.includes(search) ||
        u.nameEn.toLowerCase().includes(s) ||
        u.short.includes(search)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'QS排名') {
        if (!a.qsRank && !b.qsRank) return 0;
        if (!a.qsRank) return 1;
        if (!b.qsRank) return -1;
        return a.qsRank - b.qsRank;
      }
      if (sort === '国内排名') {
        if (!a.domesticRank && !b.domesticRank) return 0;
        if (!a.domesticRank) return 1;
        if (!b.domesticRank) return -1;
        return a.domesticRank - b.domesticRank;
      }
      if (sort === '过去问数量') return b.pastExamCount - a.pastExamCount;
      return b.rating - a.rating; // 综合评分
    });
  }, [search, filter, sort, universities]);

  const renderItem = useCallback(
    ({ item }: { item: University; index: number }) => (
      <UniversityCard
        u={item}
        isTarget={targetIds.has(item.id)}
        onPress={() => router.push(`/university/${item.id}` as any)}
      />
    ),
    [router, targetIds],
  );

  const keyExtractor = useCallback((item: University) => item.id, []);

  const ListHeader = useMemo(() => (
    <View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索 中文 / 日文 / English"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Icon name="close" size={14} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Count + sort */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{list.length} 所大学</Text>
        <Pressable style={styles.sortRow} onPress={() => setSortIdx((i) => (i + 1) % SORT_CYCLE.length)}>
          <Icon name="filter" size={11} color={Colors.blue500} />
          <Text style={styles.sortText}>{sort} ↕</Text>
        </Pressable>
      </View>
    </View>
  ), [search, filter, list.length, styles, Colors]);

  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Icon name="search" size={32} color={Colors.textMuted} />
      <Text style={styles.emptyText}>没找到「{search}」相关大学</Text>
    </View>
  ), [search, styles, Colors]);

  const ListFooter = <View style={{ height: 24 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>大学评分</Text>
          <Text style={styles.subtitle}>修考难度 · 过去问完整度 · 教授透明度</Text>
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}
