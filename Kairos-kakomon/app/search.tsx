import { memo, useCallback, useMemo, useState } from 'react';
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
import { AdGateModal, Icon, SchoolLogo } from '@/components/ui';
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, KAKOMON_SEARCH_RECENT, KAKOMON_SEARCH_HOT, DEMO_USER } from '@/mocks/data';
import { dictGradName, dictGrads, useDictStore } from '@/store/dictStore';
import { useAuthStore } from '@/store/authStore';
import { useAdStore } from '@/store/adStore';
import { canAccessQuestion, lockHint, type LockReason } from '@/utils/accessPolicy';

const FILTER_OPTIONS = {
  school: ['全部', '东大', '东工大', '京大', '早大', '庆应', '阪大'],
  year:    ['全部', '2026', '2025', '2024', '2023', '2022', '2021', '2019'],
  subject: ['全部', '数学', '情报', '物理', '统计'],
  difficulty: ['全部', '简单', '中等', '偏难', '极难'],
};

type FilterKey = keyof typeof FILTER_OPTIONS;
type Filters = Record<FilterKey, string>;

function HighlightText({ text, keyword, Colors }: { text: string; keyword: string; Colors: ThemeColors }) {
  const highlight = StyleSheet.create({
    mark: { backgroundColor: Colors.amber500 + '44', color: Colors.amber600 },
  });
  if (!keyword) return <Text>{text}</Text>;
  const idx = text.indexOf(keyword);
  if (idx === -1) return <Text>{text}</Text>;
  return (
    <Text>
      {text.slice(0, idx)}
      <Text style={highlight.mark}>{text.slice(idx, idx + keyword.length)}</Text>
      {text.slice(idx + keyword.length)}
    </Text>
  );
}

function BrowseDrillDown({
  universityId, grad, onBackToSchools, onPickGrad, onBackToGrads, onOpenQuestion, Colors, styles,
}: {
  universityId: string;
  grad: string | null;
  onBackToSchools: () => void;
  onPickGrad: (grad: string) => void;
  onBackToGrads: () => void;
  onOpenQuestion: (q: (typeof KAKOMON_QUESTIONS)[number]) => void;
  Colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  const u = KAKOMON_UNIVERSITIES.find((x) => x.id === universityId);
  // Subscribe to dict version so component re-renders when dictionary refreshes
  useDictStore((s) => s.version);

  // 该校实际有题目的研究科（按题量），与预设研究科列表合并。
  const gradList = useMemo(() => {
    const counts = new Map<string, number>();
    KAKOMON_QUESTIONS
      .filter((q) => q.universityId === universityId)
      .forEach((q) => counts.set(q.graduateSchool, (counts.get(q.graduateSchool) ?? 0) + 1));
    const preset = dictGrads(universityId);
    const names = Array.from(new Set([...preset, ...counts.keys()]));
    return names
      .map((name) => ({ name, count: counts.get(name) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [universityId]);

  const gradQuestions = useMemo(
    () => (grad
      ? KAKOMON_QUESTIONS.filter((q) => q.universityId === universityId && q.graduateSchool === grad)
      : []),
    [universityId, grad],
  );

  return (
    <View style={styles.section}>
      {/* 面包屑 */}
      <View style={styles.crumbRow}>
        <Pressable onPress={onBackToSchools}><Text style={styles.crumbLink}>全部学校</Text></Pressable>
        <Text style={styles.crumbSep}>/</Text>
        {grad ? (
          <Pressable onPress={onBackToGrads}><Text style={styles.crumbLink}>{u?.short}</Text></Pressable>
        ) : (
          <Text style={styles.crumbCurrent}>{u?.short}</Text>
        )}
        {grad && (
          <>
            <Text style={styles.crumbSep}>/</Text>
            <Text style={styles.crumbCurrent} numberOfLines={1}>{dictGradName(universityId, grad)}</Text>
          </>
        )}
      </View>

      {!grad ? (
        // 研究科列表
        gradList.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="layers" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>该校研究科信息整理中</Text>
          </View>
        ) : (
          gradList.map((g) => (
            <Pressable key={g.name} style={styles.gradRow} onPress={() => onPickGrad(g.name)}>
              <Text style={styles.gradName} numberOfLines={1}>{dictGradName(universityId, g.name)}</Text>
              <Text style={styles.gradCount}>{g.count} 题</Text>
              <Icon name="chevronRight" size={16} color={Colors.textMuted} />
            </Pressable>
          ))
        )
      ) : (
        // 习题列表
        gradQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="search" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>该研究科暂无题目</Text>
            <Text style={styles.emptyHint}>换个研究科试试</Text>
          </View>
        ) : (
          gradQuestions.map((q) => (
            <Pressable key={q.id} style={styles.resultCard} onPress={() => onOpenQuestion(q)}>
              <View style={styles.resultChips}>
                <View style={styles.uniChip}><Text style={styles.uniChipText}>{u?.short ?? '—'}</Text></View>
                <Text style={styles.resultMeta}>{q.year} · {q.subject} {q.questionNo}</Text>
              </View>
              <Text style={styles.resultTitle}>{q.title}</Text>
              <View style={styles.resultKPs}>
                {(q.knowledgePoints ?? []).slice(0, 3).map((k) => (
                  <View key={k} style={styles.kpChip}><Text style={styles.recentChipText}>#{k}</Text></View>
                ))}
              </View>
            </Pressable>
          ))
        )
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, paddingTop: 8, gap: 0 },

  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { flex: 1, position: 'relative' },
  input: { height: 38, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingRight: 36, fontSize: Typography.sm, color: c.textPrimary },
  clearBtn: { position: 'absolute', right: 12, top: 12 },

  section: { marginBottom: Spacing.lg },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  sectionMore: { fontSize: Typography.xs, color: c.textMuted },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  recentChipText: { fontSize: Typography.xs, color: c.textSecondary },
  hotChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.blue500 + '22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  topLabel: { fontSize: 9, color: c.rose500, fontWeight: Typography.weightBold },
  hotChipText: { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightMedium },

  schoolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  schoolCard: { width: '30%', backgroundColor: c.surface, borderRadius: Spacing.cardRadius, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, gap: 6, borderWidth: 1, borderColor: c.border },
  schoolIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: c.blue500 + '22', alignItems: 'center', justifyContent: 'center' },
  schoolIconText: { fontSize: 13, fontWeight: Typography.weightBold, color: c.blue500 },
  schoolName: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  schoolCount: { fontSize: Typography.xs, color: c.textMuted },

  filterSection: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  filterChipActive: { backgroundColor: c.blue500 + '22', borderColor: c.blue500 },
  filterChipOpen: { borderColor: c.blue500 },
  filterChipText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  filterChipTextActive: { color: c.blue500, fontWeight: Typography.weightSemibold },
  // 全宽选项面板（横向滚动行下方，不被裁剪）
  optionPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, padding: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: c.surfaceAlt },
  optionChipActive: { backgroundColor: c.blue500 },
  optionChipText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  optionChipTextActive: { color: '#fff', fontWeight: Typography.weightSemibold },

  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  resultsCount: { fontSize: Typography.sm, color: c.textMuted },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortLabel: { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightSemibold },

  resultCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 6, marginBottom: 8 },
  resultCardLocked: { opacity: 0.85 },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.amber500 + '22', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12, marginLeft: 'auto' },
  lockBadgeText: { fontSize: 10, color: c.amber600, fontWeight: Typography.weightBold },
  lockHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lockHintText: { fontSize: Typography.xs, color: c.amber600, fontWeight: Typography.weightMedium },
  resultChips: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uniChip: { backgroundColor: c.blue500 + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  uniChipText: { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightSemibold },
  resultMeta: { fontSize: Typography.xs, color: c.textMuted },
  resultTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, lineHeight: Typography.sm * 1.4 },
  resultKPs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  kpChip: { borderWidth: 1, borderColor: c.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textSecondary },
  emptyHint: { fontSize: Typography.sm, color: c.textMuted },

  // Browse drill-down（学校→研究科→习题）
  crumbRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md, flexWrap: 'wrap' },
  crumbLink: { fontSize: Typography.sm, color: c.blue500, fontWeight: Typography.weightSemibold },
  crumbSep: { fontSize: Typography.sm, color: c.textMuted },
  crumbCurrent: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.weightSemibold },

  gradRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  gradName: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  gradCount: { fontSize: Typography.xs, color: c.textMuted },
});

type ResultCardProps = {
  q: typeof KAKOMON_QUESTIONS[number];
  query: string;
  locked: boolean;
  reason: LockReason | null;
  styles: ReturnType<typeof makeStyles>;
  Colors: ThemeColors;
  onPress: (q: typeof KAKOMON_QUESTIONS[number], locked: boolean, reason: LockReason | null) => void;
};

function ResultCardImpl({ q, query, locked, reason, styles, Colors, onPress }: ResultCardProps) {
  const u = KAKOMON_UNIVERSITIES.find((x) => x.id === q.universityId);
  return (
    <Pressable
      style={[styles.resultCard, locked && styles.resultCardLocked]}
      onPress={() => onPress(q, locked, reason)}
    >
      <View style={styles.resultChips}>
        <View style={styles.uniChip}>
          <Text style={styles.uniChipText}>{u?.short ?? '—'}</Text>
        </View>
        <Text style={styles.resultMeta}>{q.year} · {q.subject} {q.questionNo}</Text>
        {locked && (
          <View style={styles.lockBadge}>
            <Icon name="lock" size={9} color={Colors.amber600} />
            <Text style={styles.lockBadgeText}>看广告</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultTitle}>
        <HighlightText text={q.title} keyword={query} Colors={Colors} />
      </Text>
      {locked && reason ? (
        <View style={styles.lockHintRow}>
          <Icon name="lock" size={11} color={Colors.amber600} />
          <Text style={styles.lockHintText}>{lockHint(reason)}</Text>
        </View>
      ) : (
        <View style={styles.resultKPs}>
          {(q.knowledgePoints ?? []).slice(0, 3).map((k) => (
            <View key={k} style={styles.kpChip}>
              <HighlightText text={`#${k}`} keyword={query} Colors={Colors} />
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const ResultCard = memo(ResultCardImpl);

export default function SearchScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  // 校徽回退色块的强调色（按 accent）。
  const SCHOOL_ACCENT: Record<string, string> = {
    blue: Colors.blue500, teal: Colors.teal500, indigo: Colors.indigo500, amber: Colors.amber500, rose: Colors.rose500,
  };

  const router = useRouter();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  // Subscribe to unlock maps so the list re-renders right after an ad unlock.
  useAdStore((s) => s.unlockedQuestionIds);
  useAdStore((s) => s.unlockedSchoolYears);
  const unlockSchoolYear = useAdStore((s) => s.unlockSchoolYear);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    school: '全部', year: '全部', subject: '全部', difficulty: '全部',
  });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [gate, setGate] = useState<{ questionId: string; universityId: string; uniShort: string; year: number; reason: 'year' | 'school' | 'both' } | null>(null);

  // 浏览下钻：学校 → 研究科 → 习题。
  const [browseUni, setBrowseUni] = useState<string | null>(null);
  const [browseGrad, setBrowseGrad] = useState<string | null>(null);

  const hasQuery = query.trim().length > 0;

  const results = useMemo(() => {
    if (!hasQuery) return [];
    const kw = query.trim();
    return KAKOMON_QUESTIONS.filter((q) => {
      const u = KAKOMON_UNIVERSITIES.find((x) => x.id === q.universityId);
      const matchKw =
        q.title.includes(kw) ||
        (q.knowledgePoints ?? []).some((k) => k.includes(kw)) ||
        (u && u.short.includes(kw)) ||
        q.subject.includes(kw);
      if (!matchKw) return false;
      if (filters.school !== '全部' && u && u.short !== filters.school) return false;
      if (filters.year !== '全部' && String(q.year) !== filters.year) return false;
      if (filters.subject !== '全部' && q.subject !== filters.subject) return false;
      return true;
    });
  }, [query, hasQuery, filters]);

  const setFilter = (k: FilterKey, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setOpenFilter(null);
  };

  const handleResultPress = useCallback(
    (q: typeof KAKOMON_QUESTIONS[number], locked: boolean, reason: LockReason | null) => {
      if (locked && reason) {
        const u = KAKOMON_UNIVERSITIES.find((x) => x.id === q.universityId);
        setGate({ questionId: q.id, universityId: q.universityId, uniShort: u?.short ?? '该校', year: q.year, reason });
      } else {
        router.push(`/questions/${q.id}` as any);
      }
    },
    [router],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar header */}
      <View style={styles.searchHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="搜索题目 / 知识点 / 学校"
            placeholderTextColor={Colors.textMuted}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={() => setQuery('')}>
              <Icon name="close" size={14} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Empty state: discovery（含 学校→研究科→习题 下钻） ── */}
        {!hasQuery && !browseUni && (
          <>
            {/* Recent searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最近搜索</Text>
              <View style={styles.chipRow}>
                {KAKOMON_SEARCH_RECENT.map((r) => (
                  <Pressable key={r} style={styles.recentChip} onPress={() => setQuery(r)}>
                    <Icon name="search" size={11} color={Colors.textMuted} />
                    <Text style={styles.recentChipText}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Hot keywords */}
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>热门关键词</Text>
                <Text style={styles.sectionMore}>基于 7 日搜索量</Text>
              </View>
              <View style={styles.chipRow}>
                {KAKOMON_SEARCH_HOT.map((h, i) => (
                  <Pressable key={h} style={styles.hotChip} onPress={() => setQuery(h)}>
                    {i < 3 && <Text style={styles.topLabel}>TOP {i + 1}</Text>}
                    <Text style={styles.hotChipText}>{h}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Browse by school — 显示全部学校 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>按学校浏览</Text>
              <View style={styles.schoolGrid}>
                {KAKOMON_UNIVERSITIES.map((u) => (
                  <Pressable
                    key={u.id}
                    style={styles.schoolCard}
                    onPress={() => { setBrowseUni(u.id); setBrowseGrad(null); }}
                  >
                    <SchoolLogo
                      logoUrl={u.logoUrl}
                      short={u.short}
                      accent={SCHOOL_ACCENT[u.accent] ?? Colors.blue500}
                      size={40}
                      radius={10}
                    />
                    <Text style={styles.schoolName}>{u.short}</Text>
                    <Text style={styles.schoolCount}>{u.pastExamCount}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Browse drill-down: 研究科 / 习题 ── */}
        {!hasQuery && browseUni && (
          <BrowseDrillDown
            universityId={browseUni}
            grad={browseGrad}
            onBackToSchools={() => { setBrowseUni(null); setBrowseGrad(null); }}
            onPickGrad={setBrowseGrad}
            onBackToGrads={() => setBrowseGrad(null)}
            onOpenQuestion={(q) => {
              const access = canAccessQuestion(user, { universityId: q.universityId, gradSchool: q.graduateSchool, year: q.year, questionId: q.id });
              if (!access.allowed && access.reason) {
                const u = KAKOMON_UNIVERSITIES.find((x) => x.id === q.universityId);
                setGate({ questionId: q.id, universityId: q.universityId, uniShort: u?.short ?? '该校', year: q.year, reason: access.reason });
              } else {
                router.push(`/questions/${q.id}` as any);
              }
            }}
            Colors={Colors}
            styles={styles}
          />
        )}

        {/* ── Has query: filters + results ── */}
        {hasQuery && (
          <>
            {/* Filter chips */}
            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map((key) => {
                  const isAll = filters[key] === '全部';
                  const isOpen = openFilter === key;
                  return (
                    <Pressable
                      key={key}
                      style={[styles.filterChip, !isAll && styles.filterChipActive, isOpen && styles.filterChipOpen]}
                      onPress={() => setOpenFilter(isOpen ? null : key)}
                    >
                      <Text style={[styles.filterChipText, !isAll && styles.filterChipTextActive]}>
                        {key === 'school' ? '学校' : key === 'year' ? '年份' : key === 'subject' ? '科目' : '难度'}
                        {!isAll ? `：${filters[key]}` : ''}
                      </Text>
                      <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={11} color={isAll ? Colors.textMuted : Colors.blue500} />
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* 选项面板：全宽渲染在筛选行下方，不被横向 ScrollView 裁剪 */}
              {openFilter && (
                <View style={styles.optionPanel}>
                  {FILTER_OPTIONS[openFilter].map((opt) => {
                    const active = filters[openFilter] === opt;
                    return (
                      <Pressable
                        key={opt}
                        style={[styles.optionChip, active && styles.optionChipActive]}
                        onPress={() => setFilter(openFilter, opt)}
                      >
                        <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Results */}
            <View style={styles.section}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{results.length} 个结果</Text>
                <View style={styles.sortRow}>
                  <Icon name="filter" size={11} color={Colors.blue500} />
                  <Text style={styles.sortLabel}>相关度</Text>
                </View>
              </View>

              {results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="search" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>没找到「{query}」相关题目</Text>
                  <Text style={styles.emptyHint}>换个关键词试试</Text>
                </View>
              ) : (
                results.map((q) => {
                  const access = canAccessQuestion(user, { universityId: q.universityId, gradSchool: q.graduateSchool, year: q.year, questionId: q.id });
                  const locked = !access.allowed;
                  return (
                    <ResultCard
                      key={q.id}
                      q={q}
                      query={query}
                      locked={locked}
                      reason={access.reason}
                      styles={styles}
                      Colors={Colors}
                      onPress={handleResultPress}
                    />
                  );
                })
              )}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {gate && (
        <AdGateModal
          open={!!gate}
          onClose={() => setGate(null)}
          title={`解锁 ${gate.uniShort} ${gate.year}`}
          desc={
            gate.reason === 'year'
              ? `看广告解锁 ${gate.uniShort} ${gate.year} 年全部题目 · 24 小时`
              : `${gate.uniShort} 不在免费 3 个研究科内，也可看广告解锁该大学 ${gate.year} 年题目 · 24 小时`
          }
          onUnlock={() => {
            unlockSchoolYear(gate.universityId, gate.year);
            router.push(`/questions/${gate.questionId}` as any);
          }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}
    </SafeAreaView>
  );
}
