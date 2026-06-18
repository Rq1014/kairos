import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { KAKOMON_GROUPS } from '@/mocks/data';

const MOCK_MEMBERS = [
  { name: '王学长', badge: '已合格', progress: 82 },
  { name: 'Tanaka', badge: '备考中', progress: 65 },
  { name: 'Chen',   badge: '备考中', progress: 71 },
  { name: 'Mei',    badge: '备考中', progress: 58 },
  { name: 'Kim',    badge: '备考中', progress: 54 },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', author: '组长·王学长', time: '3 天前', body: '本周任务：东大2022年线代全套题目。每天至少完成一题并在群内打卡，周五汇总。' },
  { id: 'a2', author: '组长·王学长', time: '1 周前', body: '欢迎新成员！加入后请先介绍自己的目标校和目前备考进度，方便安排学习任务。' },
];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  scroll:  { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  card:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding },

  heroCard:  { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, padding: Spacing.cardPadding, marginBottom: Spacing.md },
  heroTop:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  emojiBox:  { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emojiText: { fontSize: 28 },
  heroInfo:  { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  heroName:  { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, flex: 1 },
  heroDesc:  { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.6 },
  heroStatsRow:    { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border, marginBottom: 12 },
  heroStat:        { alignItems: 'center', gap: 4 },
  heroStatNum:     { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
  heroStatLabel:   { fontSize: Typography.xs, color: c.textMuted },
  heroStatDivider: { width: 1, backgroundColor: c.border },
  joinBtn:         { alignItems: 'center', paddingVertical: 10, borderRadius: Spacing.cardRadius },
  joinBtnJoined:   {},
  joinBtnText:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },

  taskCard: { borderRadius: Spacing.cardRadius, borderWidth: 1, padding: Spacing.cardPadding },
  taskRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  taskText: { fontSize: Typography.sm, lineHeight: Typography.sm * 1.5, flex: 1, fontWeight: Typography.weightMedium },

  overallRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  overallLabel: { fontSize: Typography.xs, color: c.textMuted },
  overallNum:   { fontSize: Typography.xs, fontWeight: Typography.weightBold },
  overallTrack: { height: 8, backgroundColor: c.surfaceAlt, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  overallFill:  { height: 8, borderRadius: 4 },

  memberList: { gap: 10 },
  memberRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberAvatar:  { width: 28, height: 28, borderRadius: 14, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberAvatarText: { fontSize: 12, fontWeight: Typography.weightBold, color: c.textSecondary },
  memberName:    { fontSize: Typography.xs, fontWeight: Typography.weightMedium, color: c.textPrimary, width: 56 },
  memberBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  memberBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  memberProgress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberTrack:   { flex: 1, height: 4, backgroundColor: c.surfaceAlt, borderRadius: 2, overflow: 'hidden' },
  memberFill:    { height: 4, borderRadius: 2 },
  memberProgressNum: { fontSize: Typography.xs, color: c.textMuted, width: 32, textAlign: 'right' },

  announcementCard:   { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 8 },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  announcementAuthor: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  announcementTime:   { fontSize: Typography.xs, color: c.textMuted },
  announcementBody:   { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.6 },

  chatNotice:     { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, marginBottom: Spacing.md },
  chatNoticeText: { fontSize: Typography.sm, color: c.textMuted },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:  { fontSize: Typography.base, color: c.textMuted },
});

export default function GroupDetailScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const ACCENT_COLORS: Record<string, { bg: string; text: string; bg100: string }> = {
    blue:   { bg: Colors.blue50,   text: Colors.blue500,   bg100: Colors.blue100 },
    teal:   { bg: Colors.teal50,   text: Colors.teal500,   bg100: Colors.teal100 },
    indigo: { bg: Colors.indigo50, text: Colors.indigo500, bg100: Colors.indigo50 },
    amber:  { bg: Colors.amber50,  text: Colors.amber500,  bg100: Colors.amber50 },
    rose:   { bg: Colors.rose50,   text: Colors.rose500,   bg100: Colors.rose50 },
  };

  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const group = KAKOMON_GROUPS.find((g) => g.id === id);
  const [joined, setJoined] = useState(group?.joined ?? false);

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>学习圈</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>学习圈未找到</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = ACCENT_COLORS[group.accent] ?? ACCENT_COLORS.blue;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.heroCard, { borderColor: accent.text + '44' }]}>
          <View style={styles.heroTop}>
            <View style={[styles.emojiBox, { backgroundColor: accent.bg }]}>
              <Text style={styles.emojiText}>{group.emoji}</Text>
            </View>
            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName} numberOfLines={1}>{group.name}</Text>
                {group.verified && <Icon name="check" size={13} color={Colors.indigo500} />}
              </View>
              <Text style={styles.heroDesc}>{group.desc}</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{group.memberCount}</Text>
              <Text style={styles.heroStatLabel}>成员</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: accent.text }]}>{group.dailyActive}</Text>
              <Text style={styles.heroStatLabel}>今日在线</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{group.openSlots}</Text>
              <Text style={styles.heroStatLabel}>剩余名额</Text>
            </View>
          </View>

          <Pressable
            style={[styles.joinBtn, joined && styles.joinBtnJoined, { backgroundColor: joined ? Colors.green50 : accent.text }]}
            onPress={() => setJoined((v) => !v)}
          >
            <Text style={[styles.joinBtnText, joined && { color: Colors.green600 }]}>
              {joined ? '✓ 已加入' : '加入学习圈'}
            </Text>
          </Pressable>
        </View>

        {/* Today's task */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日任务</Text>
          <View style={[styles.taskCard, { backgroundColor: accent.bg, borderColor: accent.text + '44' }]}>
            <View style={styles.taskRow}>
              <Icon name="book" size={14} color={accent.text} />
              <Text style={[styles.taskText, { color: accent.text }]}>{group.todayTask}</Text>
            </View>
          </View>
        </View>

        {/* Progress overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>成员进度</Text>
          <View style={styles.card}>
            <View style={styles.overallRow}>
              <Text style={styles.overallLabel}>平均进度</Text>
              <Text style={[styles.overallNum, { color: accent.text }]}>{group.avgProgress}%</Text>
            </View>
            <View style={styles.overallTrack}>
              <View style={[styles.overallFill, { width: `${group.avgProgress}%`, backgroundColor: accent.text }]} />
            </View>

            <View style={styles.memberList}>
              {MOCK_MEMBERS.map((m, i) => (
                <View key={i} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.name.slice(0, 1)}</Text>
                  </View>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <View style={[styles.memberBadge, { backgroundColor: m.badge === '已合格' ? Colors.green50 : Colors.amber50 }]}>
                    <Text style={[styles.memberBadgeText, { color: m.badge === '已合格' ? Colors.green600 : Colors.amber600 }]}>{m.badge}</Text>
                  </View>
                  <View style={styles.memberProgress}>
                    <View style={styles.memberTrack}>
                      <View style={[styles.memberFill, { width: `${m.progress}%`, backgroundColor: accent.text }]} />
                    </View>
                    <Text style={styles.memberProgressNum}>{m.progress}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>公告</Text>
          {MOCK_ANNOUNCEMENTS.map((a) => (
            <View key={a.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementAuthor}>{a.author}</Text>
                <Text style={styles.announcementTime}>{a.time}</Text>
              </View>
              <Text style={styles.announcementBody}>{a.body}</Text>
            </View>
          ))}
        </View>

        {/* Group chat notice */}
        <View style={styles.chatNotice}>
          <Icon name="message" size={16} color={Colors.textMuted} />
          <Text style={styles.chatNoticeText}>群内实时聊天功能即将上线</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
