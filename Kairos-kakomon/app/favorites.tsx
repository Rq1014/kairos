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
import { QuestionCard } from '@/components/study/QuestionCard';
import { KAKOMON_QUESTIONS } from '@/mocks/data';
import { useFavoritesStore } from '@/store/favoritesStore';

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  scroll: { padding: Spacing.screenPadding, paddingTop: 8, gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted },
  emptyHint: { fontSize: Typography.xs, color: c.textMuted },
});

export default function FavoritesScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const ids = useFavoritesStore((s) => s.ids);

  const favorites = useMemo(
    () => ids
      .map((id) => KAKOMON_QUESTIONS.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => !!q),
    [ids],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>我的收藏</Text>
          <Text style={styles.headerSub}>{favorites.length} 道收藏过去问</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {favorites.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="bookmark" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>还没有收藏的题目</Text>
            <Text style={styles.emptyHint}>在题目详情页点右上角书签即可收藏</Text>
          </View>
        ) : (
          favorites.map((q) => {
            return (
              <QuestionCard
                key={q.id}
                question={q}
                onPress={() => router.push(`/questions/${q.id}` as any)}
              />
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
