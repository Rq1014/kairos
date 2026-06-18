import type { PaginatedResponse } from '@/types/api';
import type {
  DifficultyLevel,
  KakomonQuestion,
  KnowledgeMatrixGroup,
  MasteryStatus,
  RelatedQuestion,
  WrongQuestion,
} from '@/types/question';
import {
  KAKOMON_KNOWLEDGE_MATRIX,
  KAKOMON_QUESTIONS,
  KAKOMON_WRONG_QUESTIONS,
} from '@/mocks/data';

export interface QuestionListParams {
  page?: number;
  pageSize?: number;
  universityIds?: string[];
  subjects?: string[];
  knowledgePoints?: string[];
  years?: number[];
  keyword?: string;
  sort?: 'year_desc' | 'difficulty_desc' | 'created_at_desc';
}

export interface RecommendationsResponse {
  items: KakomonQuestion[];
  basedOn: string[];
  total: number;
}

export interface RelatedQuestionsResponse {
  items: RelatedQuestion[];
  level3Total: number;
  isPro: boolean;
}

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    total: items.length,
    page,
    pageSize,
    hasMore: start + slice.length < items.length,
  };
}

function applyFilters(items: KakomonQuestion[], params: QuestionListParams = {}) {
  const keyword = params.keyword?.trim().toLowerCase();
  return items.filter((q) => {
    if (params.universityIds?.length && !params.universityIds.includes(q.universityId)) return false;
    if (params.subjects?.length && !params.subjects.includes(q.subject)) return false;
    if (params.years?.length && !params.years.includes(q.year)) return false;
    if (params.knowledgePoints?.length) {
      const hit = q.knowledgePoints.some((kp) => params.knowledgePoints!.includes(kp));
      if (!hit) return false;
    }
    if (keyword) {
      const hay = `${q.title} ${q.subject} ${q.questionNo} ${q.knowledgePoints.join(' ')}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    return true;
  });
}

function sortQuestions(items: KakomonQuestion[], sort?: QuestionListParams['sort']) {
  const sorted = [...items];
  if (sort === 'year_desc') {
    sorted.sort((a, b) => b.year - a.year);
  } else if (sort === 'difficulty_desc') {
    sorted.sort((a, b) => (b.crowdDifficultyRate ?? 0) - (a.crowdDifficultyRate ?? 0));
  }
  return sorted;
}

export async function getQuestions(
  params?: QuestionListParams,
): Promise<PaginatedResponse<KakomonQuestion>> {
  const filtered = sortQuestions(applyFilters(KAKOMON_QUESTIONS, params), params?.sort);
  return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
}

export async function getQuestion(id: string): Promise<KakomonQuestion> {
  const hit = KAKOMON_QUESTIONS.find((q) => q.id === id);
  if (!hit) throw new Error(`Question not found: ${id}`);
  return hit;
}

export async function getQuestionRecommendations(limit = 10): Promise<RecommendationsResponse> {
  const items = KAKOMON_QUESTIONS.slice(0, limit);
  const basedOn = Array.from(new Set(items.flatMap((q) => q.knowledgePoints))).slice(0, 3);
  return { items, basedOn, total: items.length };
}

export async function getRelatedQuestions(id: string): Promise<RelatedQuestionsResponse> {
  const hit = KAKOMON_QUESTIONS.find((q) => q.id === id);
  const items = hit?.relatedQuestions ?? [];
  return {
    items,
    level3Total: items.filter((r) => r.level === 3).length,
    isPro: false,
  };
}

export async function updateQuestionMastery(
  id: string,
  status: MasteryStatus,
): Promise<{ questionId: string; masteryStatus: MasteryStatus; weakPointsUpdated: boolean }> {
  return { questionId: id, masteryStatus: status, weakPointsUpdated: true };
}

export async function voteQuestionDifficulty(
  id: string,
  vote: DifficultyLevel,
): Promise<{ questionId: string; vote: DifficultyLevel; crowdVotes: Record<DifficultyLevel, number> }> {
  const hit = KAKOMON_QUESTIONS.find((q) => q.id === id);
  const base = hit?.crowdVotes ?? { easy: 0, medium: 0, hard: 0 };
  const crowdVotes: Record<DifficultyLevel, number> = {
    easy: base.easy ?? 0,
    medium: base.medium ?? 0,
    hard: base.hard ?? 0,
    very_hard: 0,
  };
  crowdVotes[vote] = (crowdVotes[vote] ?? 0) + 1;
  return { questionId: id, vote, crowdVotes };
}

export async function setQuestionFavorite(
  id: string,
  favorite: boolean,
): Promise<{ questionId: string; favorite: boolean }> {
  return { questionId: id, favorite };
}

export async function getWrongBook(
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<WrongQuestion>> {
  return paginate(KAKOMON_WRONG_QUESTIONS, params?.page ?? 1, params?.pageSize ?? 20);
}

export async function getKnowledgeMatrix(): Promise<{ items: KnowledgeMatrixGroup[] }> {
  return { items: KAKOMON_KNOWLEDGE_MATRIX };
}
