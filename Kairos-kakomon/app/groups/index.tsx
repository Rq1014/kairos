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
import { Icon } from '@/components/ui';
import { KAKOMON_GROUPS } from '@/mocks/data';
import type { StudyGroup } from '@/types/forum';

type Filter = '全部' | '已加入' | '我的目标校' | '科目' | '合格答疑';
const FILTERS: Filter[] = ['全部', '已加入', '我的目标校', '科目', '合格答疑'];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll:    { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub:    { fontSize: Typography.xs, color: c.textMuted },

  heroCard: { backgroundColor: c.indigo50, borderWidth: 1, borderColor: c.indigo500 + '44', borderRadius: Spacing.cardRadius, padding: Spacing.cardPadding, marginBottom: Spacing.md },
  heroRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heroText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.indigo500 },
  heroDesc: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.6, marginBottom: 12 },
  heroStats:      { flexDirection: 'row', justifyContent: 'space-around' },
  heroStat:       { alignItems: 'center', gap: 4 },
  heroStatLabel:  { fontSize: Typography.xs, color: c.textMuted },
  heroStatNum:    { fontSize: Typography.md, fontWeight: Typography.weightBold, color: c.textPrimary },
  heroStatDivider: { width: 1, backgroundColor: c.border },

  filterScroll: { marginBottom: Spacing.md },
  filterRow:    { flexDirection: 'row', gap: 8 },
  filterChip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  filterChipActive:   { backgroundColor: c.indigo500 + '22', borderColor: c.indigo500 },
  filterChipText:     { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  filterChipTextActive: { color: c.indigo500, fontWeight: Typography.weightSemibold },

  card:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  cardPad: { padding: Spacing.cardPadding },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 },
  emojiBox:    { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emojiText:   { fontSize: 24 },
  cardInfo:    { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName:    { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary, flex: 1 },
  cardMeta:    { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  joinedBadge: { backgroundColor: c.green50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  joinedBadgeText: { fontSize: Typography.xs, color: c.green600, fontWeight: Typography.weightMedium },

  desc: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.6, marginBottom: 8 },
  taskRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 },
  taskText: { fontSize: Typography.xs, color: c.textMuted, flex: 1 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge:    { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: Typography.xs, color: c.textSecondary },
  slotsTag:  { backgroundColor: c.rose50, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  slotsText: { fontSize: Typography.xs, color: c.rose600, fontWeight: Typography.weightMedium },

  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressLabel: { fontSize: Typography.xs, color: c.textMuted, width: 48 },
  progressTrack: { flex: 1, height: 6, backgroundColor: c.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },
  progressNum:   { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, width: 32, textAlign: 'right' },

  joinBtn:         { alignItems: 'center', paddingVertical: 8, borderRadius: Spacing.cardRadius, backgroundColor: c.indigo600 },
  joinBtnJoined:   { backgroundColor: c.green50 },
  joinBtnText:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
  joinBtnTextJoined: { color: c.green600 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText:  { fontSize: Typography.base, color: c.textSecondary },
});

function GroupCard({ g, joined, onJoin, onPress, Colors, styles }: { g: StudyGroup; joined: boolean; onJoin: () => void; onPress: () => void; Colors: ThemeColors; styles: ReturnType<typeof makeStyles> }) {
  const ACCENT_COLORS: Record<string, { bg: string; text: string }> = {
    blue:   { bg: Colors.blue50,   text: Colors.blue500 },
    teal:   { bg: Colors.teal50,   text: Colors.teal500 },
    indigo: { bg: Colors.indigo50, text: Colors.indigo500 },
    amber:  { bg: Colors.amber50,  text: Colors.amber500 },
    rose:   { bg: Colors.rose50,   text: Colors.rose500 },
  };
  const accent = ACCENT_COLORS[g.accent] ?? ACCENT_COLORS.blue;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardPad}>
        <View style={styles.cardTop}>
          <View style={[styles.emojiBox, { backgroundColor: accent.bg }]}>
            <Text style={styles.emojiText}>{g.emoji}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardName} numberOfLines={1}>{g.name}</Text>
              {g.verified && <Icon name="check" size={13} color={Colors.indigo500} />}
              {g.joined && (
                <View style={styles.joinedBadge}>
                  <Text style={styles.joinedBadgeText}>已加入</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardMeta}>{g.memberCount} 人 · {g.dailyActive} 在线</Text>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={2}>{g.desc}</Text>

        <View style={styles.taskRow}>
          <Icon name="book" size={11} color={Colors.textMuted} />
          <Text style={styles.taskText} numberOfLines={1}>{g.todayTask}</Text>
        </View>

        <View style={styles.badgeRow}>
          {g.badges.map((b) => (
            <View key={b} style={styles.badge}>
              <Text style={styles.badgeText}>{b}</Text>
            </View>
          ))}
          <View style={styles.slotsTag}>
            <Text style={styles.slotsText}>剩余 {g.openSlots} 名</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>平均进度</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${g.avgProgress}%`, backgroundColor: accent.text }]} />
          </View>
          <Text style={[styles.progressNum, { color: accent.text }]}>{g.avgProgress}%</Text>
        </View>

        <Pressable
          style={[styles.joinBtn, joined && styles.joinBtnJoined]}
          onPress={(e) => { e.stopPropagation?.(); onJoin(); }}
        >
          <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
            {joined ? '✓ 已加入' : '加入学习圈'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function GroupListScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('全部');
  const [joinedIds, setJoinedIds] = useState<Set<string>>(
    () => new Set(KAKOMON_GROUPS.filter((g) => g.joined).map((g) => g.id)),
  );

  const filtered = useMemo(() => {
    return KAKOMON_GROUPS.filter((g) => {
      if (filter === '已加入') return g.joined;
      if (filter === '我的目标校') return !!g.target;
      if (filter === '科目') return g.scope === 'subject' || g.scope === 'school+subject';
      if (filter === '合格答疑') return g.scope === 'experience';
      return true;
    });
  }, [filter]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>学习圈</Text>
          <Text style={styles.headerSub}>找到一起练习的朋友</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero stats */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Icon name="user" size={14} color={Colors.indigo500} />
            <Text style={styles.heroText}>和你目标校的同学组队刷题</Text>
          </View>
          <Text style={styles.heroDesc}>
            按学校 / 科目 / 经验找到合适小组，每天共同打卡，遇到难题群内即时讨论。
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>活跃学习圈</Text>
              <Text style={styles.heroStatNum}>{KAKOMON_GROUPS.length}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>今日打卡</Text>
              <Text style={[styles.heroStatNum, { color: Colors.indigo500 }]}>177</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>已合格成员</Text>
              <Text style={[styles.heroStatNum, { color: Colors.green600 }]}>34</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Group list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="user" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>没有符合条件的学习圈</Text>
          </View>
        ) : (
          filtered.map((g) => (
            <GroupCard
              key={g.id}
              g={g}
              joined={joinedIds.has(g.id)}
              Colors={Colors}
              styles={styles}
              onJoin={() => setJoinedIds((prev) => {
                const next = new Set(prev);
                if (next.has(g.id)) {
                  next.delete(g.id);
                } else {
                  next.add(g.id);
                }
                return next;
              })}
              onPress={() => router.push(`/groups/${g.id}` as any)}
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
