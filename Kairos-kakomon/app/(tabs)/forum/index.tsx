import { memo, useCallback, useMemo, useState } from 'react';
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
import { getForumThreads, getStudyGroups } from '@/api/forum';
import { KAKOMON_THREADS, KAKOMON_UNIVERSITIES, KAKOMON_QUESTIONS, KAKOMON_GROUPS } from '@/mocks/data';
import type { ForumThread, ThreadType } from '@/types/forum';

type Tab = '全部' | '题目讨论' | '资料互助' | '合格经验' | '同校备考';
const TABS: Tab[] = ['全部', '题目讨论', '资料互助', '合格经验', '同校备考'];

const TAB_TYPE_MAP: Partial<Record<Tab, ThreadType>> = {
  '题目讨论': 'question_discussion',
  '资料互助': 'material_request',
  '合格经验': 'experience',
  '同校备考': 'study_circle',
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll:    { paddingHorizontal: Spacing.screenPadding, paddingTop: 8 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  title:     { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: c.textPrimary },
  subtitle:  { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  composeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.indigo600, alignItems: 'center', justifyContent: 'center' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  searchInput: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },

  tabScroll: { marginTop: 10 },
  tabRow:    { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  tabChip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  tabChipActive:   { backgroundColor: c.indigo500 + '22', borderColor: c.indigo500 },
  tabChipText:     { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  tabChipTextActive: { color: c.indigo500, fontWeight: Typography.weightSemibold },

  pinnedCard:  { marginTop: 12, backgroundColor: c.indigo50, borderWidth: 1, borderColor: c.indigo500 + '44', borderRadius: Spacing.cardRadius, padding: Spacing.cardPadding },
  pinnedRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pinnedLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.indigo500 },
  pinnedTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: 4 },
  pinnedSub:   { fontSize: Typography.xs, color: c.textMuted },

  groupsSection: { marginTop: 14 },
  groupsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  groupsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupsTitle:    { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  groupsMore:     { fontSize: Typography.xs, color: c.indigo500, fontWeight: Typography.weightSemibold },
  groupsRow:      { flexDirection: 'row', gap: 10 },
  groupCard:      { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: 12, width: 200 },
  groupCardTop:   { flexDirection: 'row', gap: 8, marginBottom: 8 },
  groupEmoji:     { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  groupEmojiText: { fontSize: 16 },
  groupNameWrap:  { flex: 1, justifyContent: 'center' },
  groupName:      { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: c.textPrimary },
  groupMeta:      { fontSize: Typography.xs, color: c.textMuted },
  groupTask:      { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.5, minHeight: 32 },
  groupJoinBtn:       { marginTop: 8, alignItems: 'center', paddingVertical: 5, borderRadius: 8, backgroundColor: c.indigo600 },
  groupJoinBtnJoined: { backgroundColor: c.green50 },
  groupJoinText:       { fontSize: Typography.xs, color: '#fff', fontWeight: Typography.weightSemibold },
  groupJoinTextJoined: { color: c.green600 },

  threadList: { marginTop: 14 },

  threadCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 8 },
  threadMeta:    { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  typeBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  uniBadge:      { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  uniBadgeText:  { fontSize: Typography.xs, color: c.textSecondary },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  threadTitle:   { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, lineHeight: Typography.sm * 1.4 },
  threadExcerpt: { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.5, marginTop: 4 },
  linkedQ:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 8, marginTop: 8 },
  linkedQText:   { fontSize: Typography.xs, color: c.textMuted, flex: 1 },
  threadFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  threadAuthor:  { fontSize: Typography.xs, color: c.textMuted },
  threadStats:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  threadStatNum: { fontSize: Typography.xs, color: c.textMuted },
  threadTime:    { fontSize: Typography.xs, color: c.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText:  { fontSize: Typography.base, color: c.textSecondary },
});

function ThreadCardImpl({ thread, onPress }: { thread: ForumThread; onPress: () => void }) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const TYPE_LABELS: Record<ThreadType, { label: string; color: string; bgColor: string }> = {
    question_discussion: { label: '题目讨论', color: Colors.blue500,   bgColor: Colors.blue50 },
    material_request:    { label: '资料互助', color: Colors.amber500,  bgColor: Colors.amber50 },
    experience:          { label: '合格经验', color: Colors.green600,  bgColor: Colors.green50 },
    study_circle:        { label: '同校备考', color: Colors.indigo500, bgColor: Colors.indigo50 },
  };

  const t = thread;
  const u = t.universityId ? KAKOMON_UNIVERSITIES.find((x) => x.id === t.universityId) : null;
  const q = t.questionId   ? KAKOMON_QUESTIONS.find((x) => x.id === t.questionId)     : null;
  const typeInfo = TYPE_LABELS[t.type];

  return (
    <Pressable style={styles.threadCard} onPress={onPress}>
      <View style={styles.threadMeta}>
        <View style={[styles.typeBadge, { backgroundColor: typeInfo.bgColor }]}>
          <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
        </View>
        {u && (
          <View style={styles.uniBadge}>
            <Text style={styles.uniBadgeText}>{u.short}</Text>
          </View>
        )}
        {t.materialRequestStatus === 'solved' && (
          <View style={[styles.statusBadge, { backgroundColor: Colors.green50 }]}>
            <Text style={[styles.statusBadgeText, { color: Colors.green600 }]}>✓ 已解决</Text>
          </View>
        )}
        {t.materialRequestStatus === 'unsolved' && (
          <View style={[styles.statusBadge, { backgroundColor: Colors.rose50 }]}>
            <Text style={[styles.statusBadgeText, { color: Colors.rose600 }]}>求助中</Text>
          </View>
        )}
        {t.hasAcceptedAnswer && t.type === 'question_discussion' && (
          <View style={[styles.statusBadge, { backgroundColor: Colors.green50 }]}>
            <Text style={[styles.statusBadgeText, { color: Colors.green600 }]}>✓ 已采纳</Text>
          </View>
        )}
      </View>

      <Text style={styles.threadTitle}>{t.title}</Text>
      <Text style={styles.threadExcerpt} numberOfLines={2}>{t.excerpt}</Text>

      {q && (
        <View style={styles.linkedQ}>
          <Icon name="link" size={11} color={Colors.textMuted} />
          <Text style={styles.linkedQText} numberOfLines={1}>
            关联：{q.year} {q.subject} {q.questionNo} · {q.title}
          </Text>
        </View>
      )}

      <View style={styles.threadFooter}>
        <Text style={styles.threadAuthor}>{t.authorName.split(' · ')[1] ?? t.authorName}</Text>
        <View style={styles.threadStats}>
          <Icon name="message" size={11} color={Colors.textMuted} />
          <Text style={styles.threadStatNum}>{t.replyCount}</Text>
          <Icon name="eye" size={11} color={Colors.textMuted} />
          <Text style={styles.threadStatNum}>{t.viewCount}</Text>
          <Text style={styles.threadTime}>{t.lastActivity}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const ThreadCard = memo(ThreadCardImpl);

export default function ForumScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const [tab, setTab] = useState<Tab>('全部');
  const [search, setSearch] = useState('');
  const threadsQuery = useQuery({
    queryKey: ['forum', 'threads'],
    queryFn: () => getForumThreads({ page: 1, pageSize: 50 }),
  });
  const groupsQuery = useQuery({
    queryKey: ['forum', 'groups', 'home'],
    queryFn: () => getStudyGroups({ page: 1, pageSize: 10 }),
  });
  const sourceThreads = threadsQuery.data?.items?.length
    ? threadsQuery.data.items
    : KAKOMON_THREADS;
  const sourceGroups = groupsQuery.data?.items?.length
    ? groupsQuery.data.items
    : KAKOMON_GROUPS;

  const filteredThreads = useMemo(() => {
    const typeFilter = TAB_TYPE_MAP[tab];
    return sourceThreads.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (search.trim() && !t.title.includes(search) && !t.excerpt.includes(search)) return false;
      return true;
    });
  }, [tab, search, sourceThreads]);

  const handleThreadPress = useCallback(
    (id: string) => router.push(`/forum/${id}` as any),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ForumThread }) => (
      <ThreadCard thread={item} onPress={() => handleThreadPress(item.id)} />
    ),
    [handleThreadPress],
  );

  const keyExtractor = useCallback((item: ForumThread) => item.id, []);

  const ListHeader = (
    <>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索题目 / 学校 / 关键词"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Icon name="close" size={14} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={styles.tabScroll}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tabChip, tab === t && styles.tabChipActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabChipText, tab === t && styles.tabChipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Pinned "weekly topic" when on 全部 */}
      {tab === '全部' && !search && (
        <View style={styles.pinnedCard}>
          <View style={styles.pinnedRow}>
            <Icon name="trending" size={14} color={Colors.indigo500} />
            <Text style={styles.pinnedLabel}>本周话题</Text>
          </View>
          <Text style={styles.pinnedTitle}>东大 vs 东工大 · 修考线代套路对比</Text>
          <Text style={styles.pinnedSub}>24 楼 · 891 浏览 · 运营整理中</Text>
        </View>
      )}

      {/* Study Groups horizontal strip — only on 全部 */}
      {tab === '全部' && !search && (
        <View style={styles.groupsSection}>
          <View style={styles.groupsHeader}>
            <View style={styles.groupsTitleRow}>
              <Icon name="user" size={13} color={Colors.indigo500} />
              <Text style={styles.groupsTitle}>学习圈 · 一起刷题</Text>
            </View>
            <Pressable onPress={() => router.push('/groups' as any)}>
              <Text style={styles.groupsMore}>查看全部</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupsRow}>
            {sourceGroups.slice(0, 4).map((g) => (
              <Pressable
                key={g.id}
                style={styles.groupCard}
                onPress={() => router.push(`/groups/${g.id}` as any)}
              >
                <View style={styles.groupCardTop}>
                  <View style={[styles.groupEmoji, { backgroundColor: Colors.indigo50 }]}>
                    <Text style={styles.groupEmojiText}>{g.emoji}</Text>
                  </View>
                  <View style={styles.groupNameWrap}>
                    <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
                    <Text style={styles.groupMeta}>{g.memberCount} 人 · {g.dailyActive} 在线</Text>
                  </View>
                </View>
                <Text style={styles.groupTask} numberOfLines={2}>{g.todayTask}</Text>
                <View style={[styles.groupJoinBtn, g.joined && styles.groupJoinBtnJoined]}>
                  <Text style={[styles.groupJoinText, g.joined && styles.groupJoinTextJoined]}>
                    {g.joined ? '✓ 已加入' : '加入'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.threadList} />
    </>
  );

  const ListEmpty = (
    <View style={styles.emptyState}>
      <Icon name="message" size={32} color={Colors.textMuted} />
      <Text style={styles.emptyText}>{search ? `没找到「${search}」相关帖子` : '暂无帖子'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>论坛</Text>
          <Text style={styles.subtitle}>题目 · 资料 · 经验 · 同校</Text>
        </View>
        <Pressable style={styles.composeBtn} onPress={() => router.push('/forum/compose' as any)}>
          <Icon name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={filteredThreads}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    </SafeAreaView>
  );
}
