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
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';

const MOCK_EXPERIENCES = [
  { author: 'Chen学长', badge: '已合格', time: '1 个月前', text: '山田老师面试很友好，主要问了研究方向和过去做过的项目。对于分布式系统方面的知识很感兴趣，建议先看他最近的论文。', upvotes: 14 },
  { author: 'Kim', badge: '备考中', time: '3 个月前', text: '听说老师只招对并发理论感兴趣的同学，普通做项目的背景可能不够，需要有理论扎实的证明。', upvotes: 6 },
];

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  scroll:  { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: Spacing.sm },
  card:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding },

  heroCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: Spacing.md },
  heroRow:     { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroAvatar:  { width: 60, height: 60, borderRadius: 30, backgroundColor: c.blue500, alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { fontSize: 22, fontWeight: Typography.weightBold, color: '#fff' },
  heroInfo:    { flex: 1 },
  heroName:    { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
  heroLab:     { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  heroUni:     { fontSize: Typography.xs, color: c.blue500, marginTop: 2 },
  heroDivider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
  heroMeta:    { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem:    { alignItems: 'center', gap: 4 },
  metaLabel:   { fontSize: Typography.xs, color: c.textMuted },
  metaValue:   { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  metaDivider: { width: 1, backgroundColor: c.border },

  directionText: { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.6, marginBottom: 10 },
  topicRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip:     { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  topicChipText: { fontSize: Typography.xs, color: c.textSecondary },

  aiLockedCard:   { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.amber500 + '44', overflow: 'hidden' },
  aiLockedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.cardPadding, paddingBottom: 10 },
  aiLockedIcon:   { width: 32, height: 32, borderRadius: 8, backgroundColor: c.amber500, alignItems: 'center', justifyContent: 'center' },
  aiLockedInfo:   { flex: 1 },
  aiLockedTitle:  { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  aiLockedSub:    { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },
  proTag:         { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.amber50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  proTagText:     { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: c.amber600 },
  aiLockedBlur:   { marginHorizontal: Spacing.cardPadding, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  aiBlurText:     { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.6, padding: 10, backgroundColor: c.surfaceAlt, borderRadius: 8 },
  aiBlurOverlay:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: c.surface + 'CC' },
  aiUnlockBtn:    { margin: Spacing.cardPadding, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.amber500, borderRadius: Spacing.cardRadius, paddingVertical: 10 },
  aiUnlockText:   { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },

  admissionCard:    { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-around', padding: Spacing.cardPadding },
  admissionItem:    { alignItems: 'center', gap: 4 },
  admissionNum:     { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: c.textPrimary },
  admissionLabel:   { fontSize: Typography.xs, color: c.textMuted },
  admissionDivider: { width: 1, backgroundColor: c.border },

  expCard:       { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 8 },
  expHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expAuthorRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expAvatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  expAvatarText: { fontSize: 12, fontWeight: Typography.weightBold, color: c.textSecondary },
  expAuthor:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  expBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  expBadgeText:  { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  expTime:       { fontSize: Typography.xs, color: c.textMuted },
  expText:       { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.6 },
  expLike:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  expLikeText:   { fontSize: Typography.xs, color: c.textMuted },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:  { fontSize: Typography.base, color: c.textMuted },
});

export default function ProfessorDetailScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const { name: encodedName, universityId } = useLocalSearchParams<{ name: string; universityId?: string }>();
  const router = useRouter();
  const [likedExperiences, setLikedExperiences] = useState<Set<number>>(new Set());

  const professorName = encodedName ? decodeURIComponent(encodedName) : '';
  const university = KAKOMON_UNIVERSITIES.find((u) => u.id === universityId);
  const professor = university?.professorHighlights.find((p) => p.name === professorName);

  if (!professor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>教授详情</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Icon name="user" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>教授信息未找到</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>教授详情</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{professorName.slice(0, 1)}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{professorName}</Text>
              <Text style={styles.heroLab}>{professor.lab}</Text>
              {university && <Text style={styles.heroUni}>{university.nameCn}</Text>}
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>评价</Text>
              <Text style={styles.metaValue}>{professor.reviewCount}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>考试相关度</Text>
              <Text style={[styles.metaValue, { color: Colors.blue500 }]}>高</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>面试风格</Text>
              <Text style={[styles.metaValue, { color: Colors.green600 }]}>友好</Text>
            </View>
          </View>
        </View>

        {/* Research direction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>研究方向</Text>
          <View style={styles.card}>
            <Text style={styles.directionText}>{professor.direction}</Text>
            <View style={styles.topicRow}>
              {['分布式系统', '并发理论', '形式化验证'].map((t) => (
                <View key={t} style={styles.topicChip}>
                  <Text style={styles.topicChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* AI Summary — locked */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 总结</Text>
          <View style={styles.aiLockedCard}>
            <View style={styles.aiLockedHeader}>
              <View style={styles.aiLockedIcon}>
                <Icon name="sparkles" size={14} color="#fff" />
              </View>
              <View style={styles.aiLockedInfo}>
                <Text style={styles.aiLockedTitle}>教授 AI 分析报告</Text>
                <Text style={styles.aiLockedSub}>研究方向 · 考试模式 · 面试风格 · 招生建议</Text>
              </View>
              <View style={styles.proTag}>
                <Icon name="lock" size={11} color={Colors.amber600} />
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            </View>
            <View style={styles.aiLockedBlur}>
              <Text style={styles.aiBlurText}>
                该教授主要考察学生对分布式一致性协议（Raft/Paxos）的理解深度，面试通常会要求...
              </Text>
              <View style={styles.aiBlurOverlay} />
            </View>
            <Pressable style={styles.aiUnlockBtn} onPress={() => router.push('/paywall' as any)}>
              <Icon name="sparkles" size={14} color="#fff" />
              <Text style={styles.aiUnlockText}>解锁 AI 报告 · 升级 Pro</Text>
            </Pressable>
          </View>
        </View>

        {/* Admission stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>招生情况（近3年均值）</Text>
          <View style={styles.admissionCard}>
            <View style={styles.admissionItem}>
              <Text style={styles.admissionNum}>3–5</Text>
              <Text style={styles.admissionLabel}>年均招生</Text>
            </View>
            <View style={styles.admissionDivider} />
            <View style={styles.admissionItem}>
              <Text style={styles.admissionNum}>8.2</Text>
              <Text style={styles.admissionLabel}>申请倍率</Text>
            </View>
            <View style={styles.admissionDivider} />
            <View style={styles.admissionItem}>
              <Text style={styles.admissionNum}>12%</Text>
              <Text style={styles.admissionLabel}>通过率</Text>
            </View>
          </View>
        </View>

        {/* Experiences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{professor.reviewCount} 条合格经验</Text>
          {MOCK_EXPERIENCES.map((e, i) => {
            const liked = likedExperiences.has(i);
            return (
              <View key={i} style={styles.expCard}>
                <View style={styles.expHeader}>
                  <View style={styles.expAuthorRow}>
                    <View style={styles.expAvatar}>
                      <Text style={styles.expAvatarText}>{e.author.slice(0, 1)}</Text>
                    </View>
                    <Text style={styles.expAuthor}>{e.author}</Text>
                    <View style={[styles.expBadge, { backgroundColor: e.badge === '已合格' ? Colors.green50 : Colors.amber50 }]}>
                      <Text style={[styles.expBadgeText, { color: e.badge === '已合格' ? Colors.green600 : Colors.amber600 }]}>{e.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.expTime}>{e.time}</Text>
                </View>
                <Text style={styles.expText}>{e.text}</Text>
                <Pressable
                  style={styles.expLike}
                  onPress={() => setLikedExperiences((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) {
                      next.delete(i);
                    } else {
                      next.add(i);
                    }
                    return next;
                  })}
                >
                  <Icon name="thumbsUp" size={13} color={liked ? Colors.blue500 : Colors.textMuted} />
                  <Text style={[styles.expLikeText, liked && { color: Colors.blue500 }]}>
                    {e.upvotes + (liked ? 1 : 0)}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
