import type { PaginatedResponse } from '@/types/api';
import type {
  DifficultyLevel,
  KakomonQuestion,
  KnowledgeMatrixGroup,
  MasteryStatus,
  RelatedLevel,
  RelatedQuestion,
  WrongQuestion,
} from '@/types/question';
import { apiRequest } from './client';

// —— 后端响应形状（API-contract §2.13 / §2.14 / §2.15）——
interface QuestionListItemRaw {
  id: string;
  paperId?: string;
  universityId: string;
  graduateSchool: string;
  year: number;
  subject: string;
  subjectCode: string;
  majorId?: string;
  questionNo: string;
  title: string;
  orderIndex?: number;
  difficultyLabel?: string;
  difficultyLevel?: DifficultyLevel;
  knowledgePoints?: string[];
}

interface QuestionDetailRaw extends QuestionListItemRaw {
  contentBlocks?: KakomonQuestion['contentBlocks'];
  bodyText?: string;
}

interface RelatedRaw {
  id: string;
  title: string;
  level: number;
  matchType?: string;
  reason?: string;
}

/** 后端 list-item → KakomonQuestion。后端无 crowdDifficultyRate,补 0（Phase 2 终审 finding 3）。 */
function listItemToQuestion(raw: QuestionListItemRaw): KakomonQuestion {
  return {
    id: raw.id,
    universityId: raw.universityId,
    graduateSchool: raw.graduateSchool,
    majorId: raw.majorId,
    year: raw.year,
    subject: raw.subject,
    subjectCode: raw.subjectCode,
    questionNo: raw.questionNo,
    title: raw.title,
    orderIndex: raw.orderIndex,
    paperId: raw.paperId,
    knowledgePoints: raw.knowledgePoints ?? [],
    difficultyLabel: raw.difficultyLabel ?? '',
    difficultyLevel: raw.difficultyLevel,
    crowdDifficultyRate: 0,
  };
}

function detailToQuestion(raw: QuestionDetailRaw): KakomonQuestion {
  return {
    ...listItemToQuestion(raw),
    contentBlocks: raw.contentBlocks,
    bodyText: raw.bodyText,
  };
}

/** 后端 related → RelatedQuestion。后端缺 university/year/subject/questionNo/confidence,填空/0（Phase 2 终审 finding 1）。 */
function relatedToFront(raw: RelatedRaw): RelatedQuestion {
  const lvl = (raw.level === 1 || raw.level === 2 || raw.level === 3 ? raw.level : 2) as RelatedLevel;
  return {
    id: raw.id,
    title: raw.title,
    level: lvl,
    universityId: '',
    universityName: '',
    year: 0,
    subject: '',
    questionNo: '',
    reason: raw.reason ?? '',
    confidence: 0,
  };
}

export interface QuestionListParams {
  page?: number;
  pageSize?: number;
  universityIds?: string[];
  majorId?: string;
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

export async function getQuestions(
  params?: QuestionListParams,
): Promise<PaginatedResponse<KakomonQuestion>> {
  const uni = params?.universityIds?.[0];
  const subjectCode = params?.subjects?.[0];
  const kp = params?.knowledgePoints?.[0];
  const year = params?.years?.[0];
  const raw = await apiRequest<{
    items: QuestionListItemRaw[]; total: number; page: number; pageSize: number; hasMore: boolean;
  }>('/api/questions', {
    query: {
      universityId: uni, majorId: params?.majorId, subjectCode, knowledgePoint: kp, year,
      keyword: params?.keyword,
      page: params?.page ?? 1, pageSize: params?.pageSize ?? 20,
    },
  });
  return {
    items: (raw.items ?? []).map(listItemToQuestion),
    total: raw.total, page: raw.page, pageSize: raw.pageSize, hasMore: raw.hasMore,
  };
}

export async function getQuestion(id: string): Promise<KakomonQuestion> {
  const raw = await apiRequest<QuestionDetailRaw>(`/api/questions/${encodeURIComponent(id)}`);
  return detailToQuestion(raw);
}

export async function getQuestionRecommendations(limit = 10): Promise<RecommendationsResponse> {
  const raw = await apiRequest<{
    items: QuestionListItemRaw[]; basedOn: string[]; total: number;
  }>('/api/questions/recommendations', { query: { limit } });
  return {
    items: (raw.items ?? []).map(listItemToQuestion),
    basedOn: raw.basedOn ?? [],
    total: raw.total,
  };
}

export async function getRelatedQuestions(id: string): Promise<RelatedQuestionsResponse> {
  const raw = await apiRequest<RelatedRaw[]>(`/api/questions/${encodeURIComponent(id)}/related`);
  const items = (raw ?? []).map(relatedToFront);
  return { items, level3Total: items.filter((r) => r.level === 3).length, isPro: false };
}

export async function updateQuestionMastery(
  id: string,
  status: MasteryStatus,
): Promise<{ questionId: string; masteryStatus: MasteryStatus; weakPointsUpdated: boolean }> {
  return apiRequest(`/api/questions/${encodeURIComponent(id)}/mastery`, {
    method: 'PUT',
    body: { masteryStatus: status },
  });
}

export async function voteQuestionDifficulty(
  id: string,
  vote: DifficultyLevel,
): Promise<{ questionId: string; vote: DifficultyLevel; crowdVotes: Record<DifficultyLevel, number> }> {
  return apiRequest(`/api/questions/${encodeURIComponent(id)}/difficulty-vote`, {
    method: 'POST',
    body: { vote },
  });
}

export async function setQuestionFavorite(
  id: string,
  favorite: boolean,
): Promise<{ questionId: string; favorite: boolean }> {
  return apiRequest(`/api/questions/${encodeURIComponent(id)}/favorite`, {
    method: favorite ? 'POST' : 'DELETE',
  });
}

export async function getWrongBook(
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<WrongQuestion>> {
  return apiRequest('/api/questions/wrong-book', {
    query: { page: params?.page ?? 1, pageSize: params?.pageSize ?? 20 },
  });
}

export async function getKnowledgeMatrix(): Promise<{ items: KnowledgeMatrixGroup[] }> {
  return apiRequest('/api/questions/knowledge-matrix');
}
