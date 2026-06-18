import type { DifficultyLevel } from '@/types/question';

/** 系统难度 → 0-100 刻度（用于难度条，参考 TOEFL 难度可视化）。 */
export const DIFFICULTY_SCORE: Record<DifficultyLevel, number> = {
  easy: 30,
  medium: 55,
  hard: 78,
  very_hard: 92,
};

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  easy: '易',
  medium: '中',
  hard: '难',
  very_hard: '极难',
};

/** 难度等级 → 颜色键（配合主题色）。 */
export const DIFFICULTY_COLOR_KEY: Record<DifficultyLevel, 'green' | 'blue' | 'amber' | 'rose'> = {
  easy: 'green',
  medium: 'blue',
  hard: 'amber',
  very_hard: 'rose',
};

/** 众评难度率(0-1) → 百分比文本。 */
export function crowdDifficultyPct(rate: number): number {
  return Math.round(rate * 100);
}
