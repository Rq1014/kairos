import type { MasteryStatus } from './question';

/** 单题做题记录（继续做题 / 普通练习）。 */
export interface QuestionAttempt {
  id: string;
  questionId: string;
  universityId: string;
  year: number;
  subject: string;
  title: string;
  /** 用户自评结果（沿用掌握度三态）。null = 已打开但未评价（未完成）。 */
  result: MasteryStatus | null;
  /** 做题时间，ISO 8601。 */
  attemptedAt: string;
}

/** 一次考试模式的整场记录（自评打分）。 */
export interface ExamResult {
  id: string;
  /** 考试模式来源：模拟考试 / 专题测验 / 自由组卷。 */
  mode: 'mock' | 'topic' | 'custom';
  /** 显示用标题，如「东大 2024 数学 模考」。 */
  title: string;
  /** 涉及的学校（可多校）。 */
  universityIds: string[];
  /** 题目总数与自评得分（用户自行批改后填入）。 */
  totalCount: number;
  correctCount: number;
  /** 0-100 百分制得分。 */
  score: number;
  /** 完成时间，ISO 8601。 */
  takenAt: string;
}
