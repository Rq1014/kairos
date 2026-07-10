import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Chip } from '@/components/ui';
import type { KakomonQuestion } from '@/types/question';
import type { University } from '@/types/university';

interface QuestionCardProps {
  question: KakomonQuestion;
  university?: University;
  onPress: () => void;
  showProgress?: boolean;
  progressValue?: number;
}

const MASTERY_COLOR: Record<string, string> = {
  mastered: '#22c55e',
  unclear:  '#f59e0b',
  wrong:    '#f43f5e',
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: Spacing.cardRadius,
    padding: Spacing.cardPadding,
    gap: 6,
  },
  pressed: { opacity: 0.82 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  masteryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 2,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.weightSemibold,
    color: c.textPrimary,
    lineHeight: Typography.base * 1.4,
    marginTop: 2,
  },
  meta: {
    fontSize: Typography.xs,
    color: c.textMuted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    backgroundColor: c.surfaceAlt,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: Typography.xs,
    color: c.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: c.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: c.blue500,
    borderRadius: 2,
  },
});

export function QuestionCard({ question, university, onPress, showProgress, progressValue }: QuestionCardProps) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const masteryDot = question.masteryStatus ? MASTERY_COLOR[question.masteryStatus] : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.chips}>
        {university && <Chip color={university.accent as 'blue' | 'teal' | 'indigo'} size="sm">{university.short}</Chip>}
        <Chip color="slate" size="sm">{question.subject}</Chip>
        {question.difficultyLabel && (
          <Chip color="amber" size="sm">{question.difficultyLabel}</Chip>
        )}
        {masteryDot && (
          <View style={[styles.masteryDot, { backgroundColor: masteryDot }]} />
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{question.title}</Text>
      <Text style={styles.meta}>{question.questionNo}</Text>

      {(question.knowledgePoints?.length ?? 0) > 0 && (
        <View style={styles.tags}>
          {question.knowledgePoints.slice(0, 3).map((k) => (
            <View key={k} style={styles.tag}>
              <Text style={styles.tagText}>#{k}</Text>
            </View>
          ))}
        </View>
      )}

      {showProgress && progressValue != null && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressValue}%` as any }]} />
        </View>
      )}
    </Pressable>
  );
}
