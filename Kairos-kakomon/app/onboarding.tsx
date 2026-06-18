import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { useOnboardingStore } from '@/store/onboardingStore';

type Step = 0 | 1 | 2;

type SlideFeature = { icon: IconName; label: string; desc: string };

type Slide = {
  emoji: string;
  title: string;
  subtitle: string;
  features: readonly SlideFeature[] | null;
};

const SLIDES: readonly Slide[] = [
  {
    emoji: '🎓',
    title: '欢迎来到 Kakomon',
    subtitle: '专为日本大学院入学考试设计的\n一站式备考助手',
    features: null,
  },
  {
    emoji: '✨',
    title: '三大核心能力',
    subtitle: '帮你高效拿下名校过去问',
    features: [
      { icon: 'book',     label: '14 所名校过去问全库', desc: '东大·东工大·京大·早大·阪大·名大…' },
      { icon: 'sparkles', label: 'AI 深度解析',         desc: '逐步讲解 · 举一反三 · 错误纠正' },
      { icon: 'link',     label: '跨校关联题推荐',       desc: '同知识点 · 多校风格 · 三级联动' },
    ] as const,
  },
  {
    emoji: '🚀',
    title: '一切准备就绪',
    subtitle: '创建账号或登录已有账号\n立即开始备考',
    features: null,
  },
] as const;

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  skipBtn: {
    position: 'absolute', top: 56, right: Spacing.screenPadding, zIndex: 10,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  skipText: { fontSize: Typography.sm, color: c.textMuted },

  slideWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding, gap: 16,
  },
  emojiWrap: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: c.teal500 + '22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emoji:    { fontSize: 48 },
  title:    { fontSize: Typography['2xl'], fontWeight: Typography.weightBold, color: c.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', lineHeight: Typography.sm * 1.7, maxWidth: 280 },

  featuresWrap: { width: '100%', gap: 12, marginTop: 8 },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: c.surface, borderRadius: Spacing.cardRadius,
    padding: Spacing.cardPadding, borderWidth: 1, borderColor: c.border,
  },
  featureIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: c.teal500 + '22',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureMeta: { flex: 1, gap: 2 },
  featureLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  featureDesc:  { fontSize: Typography.xs, color: c.textMuted },

  bottom: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, gap: 20, alignItems: 'center' },
  dots:   { flexDirection: 'row', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt },
  dotActive: { width: 24, backgroundColor: c.teal500 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: c.teal500, borderRadius: 14, paddingVertical: 14, width: '100%',
  },
  nextBtnText: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: '#fff' },
});

export default function OnboardingScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const { setOnboardingDone } = useOnboardingStore();
  const [step, setStep] = useState<Step>(0);

  const slide = SLIDES[step];
  const isLast = step === 2;

  function handleComplete() {
    setOnboardingDone();
    router.replace('/(auth)/login');
  }

  function handleNext() {
    if (isLast) {
      handleComplete();
    } else {
      setStep((s) => (s + 1) as Step);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isLast && (
        <Pressable style={styles.skipBtn} onPress={handleComplete}>
          <Text style={styles.skipText}>跳过</Text>
        </Pressable>
      )}

      <View style={styles.slideWrap}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {slide.features && (
          <View style={styles.featuresWrap}>
            {slide.features.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon name={f.icon} size={16} color={Colors.teal500} />
                </View>
                <View style={styles.featureMeta}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {([0, 1, 2] as Step[]).map((i) => (
            <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{isLast ? '开始使用' : '下一步'}</Text>
          {!isLast && <Icon name="chevronRight" size={16} color="#fff" />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
