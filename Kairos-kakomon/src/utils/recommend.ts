import { KAKOMON_QUESTIONS } from '@/mocks/data';
import type { KakomonQuestion } from '@/types/question';

/**
 * 基于「专题 tag 相同」的过去问推荐（无算法 / 无评分，纯 tag 匹配）。
 *
 * 用于：做题详情页（做完这道题推荐同专题题）+ 错题本（对错题考点推荐加固题）。
 * 共享同一逻辑，避免两处各写一套。
 */

export interface RecommendInput {
  /** 排除自身。 */
  excludeQuestionId?: string;
  /** 目标专题 tag（knowledgePoints）。命中任一即算同专题。 */
  knowledgePoints?: string[];
  /** 退而求其次：同科目。 */
  subject?: string;
  limit?: number;
}

/**
 * 返回同专题(或同科目)的相关过去问，按 tag 命中数降序。
 * 不做访问权限过滤——调用方在渲染时自行用 accessPolicy 决定是否上锁。
 */
export function recommendRelated({
  excludeQuestionId,
  knowledgePoints = [],
  subject,
  limit = 4,
}: RecommendInput): KakomonQuestion[] {
  const tagSet = new Set(knowledgePoints);

  const scored = KAKOMON_QUESTIONS
    .filter((q) => q.id !== excludeQuestionId)
    .map((q) => {
      const overlap = (q.knowledgePoints ?? []).filter((k) => tagSet.has(k)).length;
      const sameSubject = subject && q.subject === subject ? 1 : 0;
      return { q, score: overlap * 10 + sameSubject };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.q);
}

/** 命中的共同专题 tag（用于展示「同专题：对角化」推荐理由）。 */
export function sharedTags(a: string[] = [], b: string[] = []): string[] {
  const setB = new Set(b);
  return a.filter((t) => setB.has(t));
}
