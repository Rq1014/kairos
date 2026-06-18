import { useMemo, useState } from 'react';
import {
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
import { Card, Icon } from '@/components/ui';
import { KAKOMON_REFERENCE_BOOKS, KAKOMON_QUESTIONS } from '@/mocks/data';
import type { ReferenceBook } from '@/types/question';

const CATEGORIES = ['全部', '考研用书', '校内编纂', '学科教材', '真题集'];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, paddingTop: 4, gap: 0 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },

  uspCard: { padding: Spacing.cardPadding, gap: 6, borderColor: c.teal500 + '44' },
  uspHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uspTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.teal500 },
  uspBody: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.5 },

  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  filterChipActive: { backgroundColor: c.teal500 + '22', borderColor: c.teal500 },
  filterChipText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  filterChipTextActive: { color: c.teal500, fontWeight: Typography.weightSemibold },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  listCount: { fontSize: Typography.sm, color: c.textMuted },
  sortLabel: { fontSize: Typography.xs, color: c.teal500, fontWeight: Typography.weightSemibold },

  bookCard: { padding: Spacing.cardPadding, gap: 10, marginBottom: 10 },
  bookRow: { flexDirection: 'row', gap: 12 },
  bookCover: { width: 56, height: 76, borderRadius: 6, alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 },
  bookCoverCategory: { fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  bookCoverTitle: { fontSize: 11, fontWeight: Typography.weightBold, color: '#fff', textAlign: 'center', marginTop: 4 },
  bookMeta: { flex: 1, gap: 3, minWidth: 0 },
  bookTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, lineHeight: Typography.base * 1.3 },
  bookSub: { fontSize: Typography.xs, color: c.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingValue: { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: c.textPrimary },
  ratingCount: { fontSize: Typography.xs, color: c.textMuted },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  outlinedChip: { borderWidth: 1, borderColor: c.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  outlinedChipText: { fontSize: Typography.xs, color: c.textSecondary },
  bookFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8 },
  bookQuestionCount: { fontSize: Typography.xs, color: c.teal500, fontWeight: Typography.weightSemibold },
  schoolTags: { flexDirection: 'row', gap: 4 },
  schoolChip: { backgroundColor: c.green50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  schoolChipText: { fontSize: Typography.xs, color: c.green600 },

  // Book detail
  heroCard: { padding: Spacing.cardPadding, gap: 12, borderWidth: 1 },
  heroRow: { flexDirection: 'row', gap: 14 },
  heroMeta: { flex: 1, gap: 6 },
  heroSubLine: { fontSize: Typography.xs, color: c.textMuted },
  heroStats: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12 },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: { fontSize: Typography.xs, color: c.textMuted },
  heroStatValue: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
  heroStatSmall: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  chapterCard: { padding: Spacing.cardPadding, marginBottom: 8 },
  chapterRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  chapterNum: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chapterNumText: { fontSize: 12, fontWeight: Typography.weightBold },
  chapterMeta: { flex: 1, gap: 4, minWidth: 0 },
  chapterTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chapterTitle: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  hotBadge: { backgroundColor: c.rose50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  hotBadgeText: { fontSize: 10, color: c.rose500, fontWeight: Typography.weightSemibold },
  chapterPages: { fontSize: Typography.xs, color: c.teal500, fontWeight: Typography.weightSemibold },
  chapterKPs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chapterFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  chapterQuestions: { fontSize: Typography.xs, color: c.textMuted },
  chapterQCount: { fontWeight: Typography.weightBold, color: c.textPrimary },
  chapterSeeAll: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold },

  expandedSection:      { borderTopWidth: 1, borderTopColor: c.border, marginTop: 8, paddingTop: 8, gap: 6 },
  expandedQuestion:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  expandedQuestionText: { flex: 1, fontSize: Typography.xs, color: c.textSecondary },
  expandedEmpty:        { fontSize: Typography.xs, color: c.textMuted, paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: c.border },
});

function BookDetailScreen({ book, onBack }: { book: ReferenceBook; onBack: () => void }) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const COVER_COLORS: Record<string, string> = {
    blue:   Colors.blue500,
    indigo: Colors.indigo500,
    teal:   Colors.teal500,
    amber:  Colors.amber500,
    rose:   Colors.rose500,
    green:  Colors.green500,
  };

  const coverColor = COVER_COLORS[book.cover] ?? Colors.blue500;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
          <Text style={styles.headerSub}>{book.titleJp}</Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <Icon name="bookmark" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Book hero */}
        <View style={styles.section}>
          <Card style={[styles.heroCard, { borderColor: coverColor + '33' }]}>
            <View style={styles.heroRow}>
              <View style={[styles.bookCover, { backgroundColor: coverColor }]}>
                <Text style={styles.bookCoverCategory}>{book.category}</Text>
                <Text style={styles.bookCoverTitle}>{book.title.split(' ')[0]}</Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroSubLine}>{book.author} · {book.lastUpdate}</Text>
                <View style={styles.ratingRow}>
                  <Icon name="star" size={12} color={Colors.amber500} />
                  <Text style={styles.ratingValue}>{book.rating}</Text>
                  <Text style={styles.ratingCount}>{book.ownedByCount.toLocaleString()} 人在用</Text>
                </View>
                <View style={styles.tagsRow}>
                  {book.tags.map((t) => (
                    <View key={t} style={styles.outlinedChip}>
                      <Text style={styles.outlinedChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>章节</Text>
                <Text style={styles.heroStatValue}>{book.chapters.length}</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>关联题</Text>
                <Text style={[styles.heroStatValue, { color: Colors.teal500 }]}>{book.coveredQuestionCount}</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>热门校</Text>
                <Text style={styles.heroStatSmall}>{book.popularSchools.join(' · ')}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Chapter list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>章节目录</Text>
          {book.chapters.map((c, i) => {
            const isExpanded = expandedChapterId === c.id;
            const matched = isExpanded
              ? KAKOMON_QUESTIONS.filter((q) =>
                  q.knowledgePoints.some((kp) => c.knowledgePoints.includes(kp))
                ).slice(0, 3)
              : [];
            return (
              <Card key={c.id} style={styles.chapterCard}>
                <View style={styles.chapterRow}>
                  <View style={[styles.chapterNum, { backgroundColor: coverColor + '22' }]}>
                    <Text style={[styles.chapterNumText, { color: coverColor }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.chapterMeta}>
                    <View style={styles.chapterTitleRow}>
                      <Text style={styles.chapterTitle} numberOfLines={1}>{c.chapter}</Text>
                      {c.hot && (
                        <View style={styles.hotBadge}>
                          <Text style={styles.hotBadgeText}>热</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.chapterPages}>{c.pages}</Text>
                    <View style={styles.chapterKPs}>
                      {c.knowledgePoints.map((k) => (
                        <View key={k} style={styles.outlinedChip}>
                          <Text style={styles.outlinedChipText}>#{k}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.chapterFooter}>
                      <Text style={styles.chapterQuestions}>
                        关联 <Text style={styles.chapterQCount}>{c.questionCount}</Text> 道过去问
                      </Text>
                      <Pressable onPress={() => setExpandedChapterId(isExpanded ? null : c.id)}>
                        <Text style={[styles.chapterSeeAll, { color: Colors.teal500 }]}>
                          {isExpanded ? '折叠 ↑' : '查看 →'}
                        </Text>
                      </Pressable>
                    </View>
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        {matched.length === 0 ? (
                          <Text style={styles.expandedEmpty}>暂无匹配题目</Text>
                        ) : matched.map((q) => (
                          <Pressable
                            key={q.id}
                            style={styles.expandedQuestion}
                            onPress={() => router.push(`/questions/${q.id}` as any)}
                          >
                            <Icon name="book" size={11} color={Colors.teal500} />
                            <Text style={styles.expandedQuestionText} numberOfLines={2}>{q.title}</Text>
                            <Icon name="chevronRight" size={11} color={Colors.textMuted} />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ReferenceIndexScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const [category, setCategory] = useState('全部');
  const [selectedBook, setSelectedBook] = useState<ReferenceBook | null>(null);

  const COVER_COLORS: Record<string, string> = {
    blue:   Colors.blue500,
    indigo: Colors.indigo500,
    teal:   Colors.teal500,
    amber:  Colors.amber500,
    rose:   Colors.rose500,
    green:  Colors.green500,
  };

  if (selectedBook) {
    return <BookDetailScreen book={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  const books = KAKOMON_REFERENCE_BOOKS.filter(
    (b) => category === '全部' || b.category === category,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>参考书索引</Text>
          <Text style={styles.headerSub}>按章节查找过去问对应位置</Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <Icon name="search" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* USP banner */}
        <View style={styles.section}>
          <Card style={styles.uspCard}>
            <View style={styles.uspHeader}>
              <Icon name="book" size={14} color={Colors.teal500} />
              <Text style={styles.uspTitle}>差异化卖点</Text>
            </View>
            <Text style={styles.uspBody}>
              每本参考书已被拆到章节、页码，并与过去问双向对应。看到一题，立刻知道翻哪本书哪一页。
            </Text>
          </Card>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.filterChip, category === c && styles.filterChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.filterChipText, category === c && styles.filterChipTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Book list */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{books.length} 本</Text>
            <Text style={styles.sortLabel}>收藏数排序</Text>
          </View>
          {books.map((b) => {
            const coverColor = COVER_COLORS[b.cover] ?? Colors.blue500;
            return (
              <Pressable key={b.id} onPress={() => setSelectedBook(b)}>
                <Card style={styles.bookCard}>
                  <View style={styles.bookRow}>
                    <View style={[styles.bookCover, { backgroundColor: coverColor }]}>
                      <Text style={styles.bookCoverCategory}>{b.category}</Text>
                      <Text style={styles.bookCoverTitle}>{b.title.split(' ')[0]}</Text>
                    </View>
                    <View style={styles.bookMeta}>
                      <Text style={styles.bookTitle}>{b.title}</Text>
                      <Text style={styles.bookSub} numberOfLines={1}>{b.titleJp} · {b.author}</Text>
                      <View style={styles.ratingRow}>
                        <Icon name="star" size={11} color={Colors.amber500} />
                        <Text style={styles.ratingValue}>{b.rating}</Text>
                        <Text style={styles.ratingCount}>· {b.ownedByCount.toLocaleString()} 人在用</Text>
                      </View>
                      <View style={styles.tagsRow}>
                        {b.tags.slice(0, 2).map((t) => (
                          <View key={t} style={styles.outlinedChip}>
                            <Text style={styles.outlinedChipText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.bookFooter}>
                    <Text style={styles.bookQuestionCount}>关联 {b.coveredQuestionCount} 道过去问</Text>
                    <View style={styles.schoolTags}>
                      {b.popularSchools.map((s) => (
                        <View key={s} style={styles.schoolChip}>
                          <Text style={styles.schoolChipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
