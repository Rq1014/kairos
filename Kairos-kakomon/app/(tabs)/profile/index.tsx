import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/api/user';
import { getUniversities } from '@/api/universities';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Avatar, Badge, Card, Icon } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useAttemptStore } from '@/store/attemptStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { DEMO_USER, KAKOMON_UNIVERSITIES } from '@/mocks/data';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, gap: 0 },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.md },
  pageTitle: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: c.textPrimary },

  section: { marginBottom: Spacing.lg },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  sectionMore: { fontSize: Typography.xs, color: c.textMuted },

  profileCard: { padding: Spacing.lg },
  profileCardPro: { backgroundColor: c.amber600 + '11' },
  profileRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
  profileSub: { fontSize: Typography.xs, color: c.textSecondary },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  contribChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.amber500 + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  contribText: { fontSize: Typography.xs, color: c.amber500, fontWeight: Typography.weightMedium },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Score curve
  scoreCard: { padding: Spacing.cardPadding, gap: 10 },
  scoreChartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110, paddingTop: 8 },
  scoreBarWrap: { flex: 1, alignItems: 'center', gap: 4 },
  scoreBarVal: { fontSize: 10, fontWeight: Typography.weightBold },
  scoreBarTrack: { width: '70%', flex: 1, justifyContent: 'flex-end', backgroundColor: c.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  scoreBar: { width: '100%', borderRadius: 4 },
  scoreBarLabel: { fontSize: 9, color: c.textMuted },
  scoreEmpty: { fontSize: Typography.xs, color: c.textMuted, textAlign: 'center', paddingVertical: 16 },
  scoreSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8 },
  scoreSummaryText: { fontSize: Typography.xs, color: c.textSecondary },

  heatmapCard: { padding: Spacing.cardPadding, gap: Spacing.sm },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: Typography.xs, color: c.textMuted },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 8 },
  weakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  weakDot: { width: 10, height: 10, borderRadius: 3 },
  weakLabel: { flex: 1, fontSize: Typography.xs, color: c.textSecondary },
  weakCount: { fontSize: Typography.xs, color: c.textMuted },

  entriesCard: { padding: 0, overflow: 'hidden' },
  entryRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  entryDivider: { borderBottomWidth: 1, borderBottomColor: c.border },
  entryIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  entryLabel: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: c.textPrimary },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

function StatCard({ icon, color, bgColor, value, label, onPress }: { icon: string; color: string; bgColor: string; value: number; label: string; onPress: () => void }) {
  const Colors = useColors();
  const statStyles = useMemo(() => StyleSheet.create({
    card: { flex: 1, borderRadius: Spacing.cardRadius, padding: Spacing.cardPadding, gap: 6, alignItems: 'flex-start' },
    icon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    value: { fontSize: Typography.xl, fontWeight: Typography.weightBold },
    label: { fontSize: Typography.xs, color: Colors.textSecondary },
  }), [Colors]);

  return (
    <Pressable style={[statStyles.card, { backgroundColor: Colors.surface }]} onPress={onPress}>
      <View style={[statStyles.icon, { backgroundColor: bgColor }]}>
        <Icon name={icon as any} size={16} color={color} />
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const Colors = useColors();
  const isDark = useThemeStore((s) => s.mode) !== 'light';
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  // 成绩曲线：考试模式记录，按时间正序。
  const examResults = useAttemptStore((s) => s.examResults);
  const scoreSeries = useMemo(() => [...examResults].reverse(), [examResults]);
  const favoriteCount = useFavoritesStore((s) => s.ids.length);

  const token = useAuthStore((s) => s.token);
  const storeUser = useAuthStore((s) => s.user);
  const meQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMe,
    enabled: !!token,
  });
  const universitiesQuery = useQuery({
    queryKey: ['universities', 'profile-targets'],
    queryFn: () => getUniversities({ page: 1, pageSize: 100 }),
    enabled: !!token,
  });

  const baseUser = meQuery.data ?? storeUser ?? DEMO_USER;
  const user = baseUser;

  const universities = universitiesQuery.data?.items?.length
    ? universitiesQuery.data.items
    : KAKOMON_UNIVERSITIES;
  const targetUnis = universities.filter((u) =>
    user.targetSchools.some((s) => s.universityId === u.id),
  );

  const heatCells: number[] = [];
  (user.weakPoints ?? []).forEach((w) => {
    for (let i = 0; i < Math.min(w.count, 6); i++) heatCells.push(w.level);
  });
  while (heatCells.length < 42) heatCells.push(0);

  // Light → dark progression that reads in both themes; empty cell = subtle surface tint.
  const heatEmpty = isDark ? Colors.slate800 : Colors.slate200;
  const HEAT_COLORS = ['', isDark ? Colors.slate600 : Colors.blue100, isDark ? Colors.blue700 : Colors.blue500, Colors.blue600, Colors.amber500, Colors.rose500];

  const QUICK_ENTRIES = [
    { icon: 'flame',    label: '我的错题', bgColor: Colors.rose50,  iconColor: Colors.rose600,  route: '/wrong-book' },
    { icon: 'bookmark', label: '我的收藏', bgColor: Colors.blue50,  iconColor: Colors.blue600,  route: '/favorites' },
    { icon: 'upload',   label: '上传贡献', bgColor: Colors.amber50, iconColor: Colors.amber600, route: '/upload-contribution' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>我的</Text>
          <Pressable onPress={() => router.push('/settings' as any)}>
            <Icon name="settings" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Profile card — 点击进入编辑资料 */}
        <View style={styles.section}>
          <Pressable onPress={() => router.push('/edit-profile' as any)}>
            <Card style={[styles.profileCard, user.isPro && styles.profileCardPro]}>
              <View style={styles.profileRow}>
                <Avatar name={user.nickname} size={52} color={user.avatarColor || undefined} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{user.nickname}</Text>
                    <Badge variant={user.isPro ? 'pro' : 'free'} />
                  </View>
                  <Text style={styles.profileSub}>
                    {user.major ? `${user.major} · ` : ''}目标 {targetUnis.map((u) => u.short).join(' / ') || '未设置'}
                  </Text>
                  {user.bio ? (
                    <Text style={styles.profileSub} numberOfLines={1}>{user.bio}</Text>
                  ) : null}
                  <View style={styles.chipRow}>
                    <View style={styles.contribChip}>
                      <Icon name="trophy" size={10} color={Colors.amber500} />
                      <Text style={styles.contribText}>贡献分 {user.contributorPoints}</Text>
                    </View>
                  </View>
                </View>
                <Icon name="chevronRight" size={16} color={Colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Study stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学习统计</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="check"    color={Colors.green500}  bgColor={Colors.green50}  value={user.solvedCount}   label="已做题"   onPress={() => router.push('/history' as any)} />
            <StatCard icon="alert"    color={Colors.amber500}  bgColor={Colors.amber50}  value={user.unclearCount}  label="模糊"      onPress={() => router.push('/wrong-book' as any)} />
            <StatCard icon="flame"    color={Colors.rose500}   bgColor={Colors.rose50}   value={user.wrongCount}    label="错题"      onPress={() => router.push('/wrong-book' as any)} />
            <StatCard icon="bookmark" color={Colors.blue500}   bgColor={Colors.blue50}   value={favoriteCount} label="收藏"      onPress={() => router.push('/favorites' as any)} />
          </View>
        </View>

        {/* Score curve (考试成绩随时间) */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>成绩曲线</Text>
            <Text style={styles.sectionMore}>模拟考试 · 共 {scoreSeries.length} 次</Text>
          </View>
          <Card style={styles.scoreCard}>
            {scoreSeries.length === 0 ? (
              <Text style={styles.scoreEmpty}>还没有考试记录 · 去「模拟考试」测一次吧</Text>
            ) : (
              <>
                <View style={styles.scoreChartRow}>
                  {scoreSeries.slice(-8).map((r) => {
                    const color = r.score >= 80 ? Colors.green500 : r.score >= 60 ? Colors.amber500 : Colors.rose500;
                    const d = new Date(r.takenAt);
                    return (
                      <View key={r.id} style={styles.scoreBarWrap}>
                        <Text style={[styles.scoreBarVal, { color }]}>{r.score}</Text>
                        <View style={styles.scoreBarTrack}>
                          <View style={[styles.scoreBar, { height: `${Math.max(r.score, 4)}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.scoreBarLabel}>{d.getMonth() + 1}/{d.getDate()}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.scoreSummary}>
                  <Text style={styles.scoreSummaryText}>最近：{scoreSeries[scoreSeries.length - 1].score} 分</Text>
                  <Text style={styles.scoreSummaryText}>
                    最高：{Math.max(...scoreSeries.map((r) => r.score))} 分 · 平均：{Math.round(scoreSeries.reduce((s, r) => s + r.score, 0) / scoreSeries.length)} 分
                  </Text>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Weak point heatmap */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>弱点地图</Text>
            <Text style={styles.sectionMore}>最近 30 天</Text>
          </View>
          <Card style={styles.heatmapCard}>
            <View style={styles.heatmap}>
              {heatCells.slice(0, 42).map((v, i) => (
                <View
                  key={i}
                  style={[
                    styles.heatCell,
                    { backgroundColor: v > 0 ? HEAT_COLORS[Math.min(v, 5)] : heatEmpty },
                  ]}
                />
              ))}
            </View>
            <View style={styles.heatLegend}>
              <Text style={styles.legendText}>少</Text>
              {HEAT_COLORS.slice(1).map((c, i) => (
                <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
              ))}
              <Text style={styles.legendText}>多</Text>
              <Text style={[styles.legendText, { marginLeft: 'auto' }]}>共 {user.weakPoints?.length ?? 0} 个弱点</Text>
            </View>
            <View style={styles.divider} />
            {(user.weakPoints ?? []).slice(0, 4).map((w, i) => (
              <View key={i} style={styles.weakRow}>
                <View style={[styles.weakDot, { backgroundColor: w.level >= 4 ? Colors.rose500 : w.level >= 3 ? Colors.amber500 : Colors.blue500 }]} />
                <Text style={styles.weakLabel}>{w.subject} · {w.point}</Text>
                <Text style={styles.weakCount}>{w.count} 错题</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Quick entries */}
        <View style={styles.section}>
          <Card style={styles.entriesCard}>
            {QUICK_ENTRIES.map((row, i, arr) => (
              <Pressable
                key={row.label}
                style={[styles.entryRow, i < arr.length - 1 && styles.entryDivider]}
                onPress={() => row.route && router.push(row.route as any)}
              >
                <View style={[styles.entryIcon, { backgroundColor: row.bgColor }]}>
                  <Icon name={row.icon as any} size={14} color={row.iconColor} />
                </View>
                <Text style={styles.entryLabel}>{row.label}</Text>
                <View style={styles.entryRight}>
                  <Icon name="chevronRight" size={14} color={Colors.textMuted} />
                </View>
              </Pressable>
            ))}
          </Card>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
