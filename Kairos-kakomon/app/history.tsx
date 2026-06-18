import { useMemo } from 'react';
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
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';
import { useAttemptStore } from '@/store/attemptStore';
import type { QuestionAttempt } from '@/types/attempt';
import type { MasteryStatus } from '@/types/question';

const RESULT_META: Record<MasteryStatus, { label: string; colorKey: 'green' | 'amber' | 'rose' }> = {
  mastered: { label: '我会', colorKey: 'green' },
  unclear: { label: '模糊', colorKey: 'amber' },
  wrong: { label: '不会', colorKey: 'rose' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 按「日」分组的标签。 */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  if (isSameDay) return '今天';
  if (isYest) return '昨天';
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  scroll: { padding: Spacing.screenPadding, paddingTop: 8 },
  dayHeader: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted, marginTop: 10, marginBottom: 6 },

  card: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 4, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: Typography.xs, color: c.textMuted, flex: 1 },
  resultChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  resultChipText: { fontSize: 10, fontWeight: Typography.weightBold },
  unfinishedChip: { backgroundColor: c.surfaceAlt, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  unfinishedText: { fontSize: 10, color: c.textMuted, fontWeight: Typography.weightSemibold },
  title: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  time: { fontSize: Typography.xs, color: c.textMuted },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted },
});

export default function HistoryScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const attempts = useAttemptStore((s) => s.attempts);

  const resultColor = (k: 'green' | 'amber' | 'rose') =>
    k === 'green' ? Colors.green500 : k === 'amber' ? Colors.amber500 : Colors.rose500;
  const resultBg = (k: 'green' | 'amber' | 'rose') =>
    k === 'green' ? Colors.green50 : k === 'amber' ? Colors.amber50 : Colors.rose50;

  // 按天分组（保持时间倒序）。
  const groups = useMemo(() => {
    const m = new Map<string, QuestionAttempt[]>();
    attempts.forEach((a) => {
      const key = dayLabel(a.attemptedAt);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(a);
    });
    return [...m.entries()];
  }, [attempts]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>做题历史</Text>
          <Text style={styles.headerSub}>共 {attempts.length} 条记录</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {attempts.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="clock" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>还没有做题记录</Text>
          </View>
        ) : (
          groups.map(([day, items]) => (
            <View key={day}>
              <Text style={styles.dayHeader}>{day}</Text>
              {items.map((a) => {
                const u = KAKOMON_UNIVERSITIES.find((x) => x.id === a.universityId);
                const rm = a.result ? RESULT_META[a.result] : null;
                return (
                  <Pressable key={a.id} style={styles.card} onPress={() => router.push(`/questions/${a.questionId}` as any)}>
                    <View style={styles.cardTop}>
                      <Text style={styles.meta}>{u?.short} {a.year} · {a.subject}</Text>
                      {rm ? (
                        <View style={[styles.resultChip, { backgroundColor: resultBg(rm.colorKey) }]}>
                          <Text style={[styles.resultChipText, { color: resultColor(rm.colorKey) }]}>{rm.label}</Text>
                        </View>
                      ) : (
                        <View style={styles.unfinishedChip}>
                          <Text style={styles.unfinishedText}>未完成</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.title} numberOfLines={1}>{a.title}</Text>
                    <Text style={styles.time}>{relativeTime(a.attemptedAt)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
