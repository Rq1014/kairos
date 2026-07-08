import type { ExamPaper } from '@/types/question';
import { apiRequest } from './client';

export interface PaperQueryParams {
  universityId?: string;
  graduateSchool?: string;
  majorId?: string | null;
}

// —— 后端响应形状（对应 API-contract §2.11 / §2.12）——
interface PaperListItemRaw {
  id: string;
  year: number;
  subject: string;
  subjectCode: string;
  title: string;
  durationMinutes?: number;
  selectRule?: { total: number; choose: number };
  questionCount: number;
}

export interface PaperQuestionRaw {
  id: string;
  questionNo: string;
  title: string;
  orderIndex: number;
  universityId: string;
  graduateSchool: string;
  year: number;
  subject: string;
  subjectCode: string;
  difficultyLabel?: string;
  difficultyLevel?: string;
  knowledgePoints?: string[];
}

interface PaperDetailRaw {
  id: string;
  universityId: string;
  graduateSchool: string;
  majorId?: string | null;
  year: number;
  subject: string;
  subjectCode: string;
  title: string;
  durationMinutes?: number;
  totalScore?: number | null;
  selectRule?: { total: number; choose: number };
  instructions?: string[];
  questions: PaperQuestionRaw[];
}

/** 详情：ExamPaper + 大问明细(供 exam-session 直接渲染,免二次请求)。 */
export type PaperDetail = ExamPaper & { questionDetails: PaperQuestionRaw[] };

function listItemToExamPaper(raw: PaperListItemRaw, scope: PaperQueryParams): ExamPaper {
  return {
    id: raw.id,
    universityId: scope.universityId ?? '',
    graduateSchool: scope.graduateSchool ?? '',
    majorId: scope.majorId ?? null,
    year: raw.year,
    subject: raw.subject,
    subjectCode: raw.subjectCode,
    title: raw.title,
    durationMinutes: raw.durationMinutes,
    totalScore: null,
    selectRule: raw.selectRule,
    instructions: undefined,
    questionIds: Array.from({ length: raw.questionCount }, (_, i) => `${raw.id}#${i}`),
  };
}

export async function getPapers(params: PaperQueryParams = {}): Promise<ExamPaper[]> {
  if (!params.universityId || !params.graduateSchool) return [];
  const raw = await apiRequest<PaperListItemRaw[]>('/api/papers', {
    query: { universityId: params.universityId, graduateSchool: params.graduateSchool },
  });
  return (raw ?? []).map((r) => listItemToExamPaper(r, params)).sort((a, b) => b.year - a.year);
}

export async function getPaper(id: string): Promise<PaperDetail> {
  const raw = await apiRequest<PaperDetailRaw>(`/api/papers/${encodeURIComponent(id)}`);
  return {
    id: raw.id,
    universityId: raw.universityId,
    graduateSchool: raw.graduateSchool,
    majorId: raw.majorId ?? null,
    year: raw.year,
    subject: raw.subject,
    subjectCode: raw.subjectCode,
    title: raw.title,
    durationMinutes: raw.durationMinutes,
    totalScore: raw.totalScore ?? null,
    selectRule: raw.selectRule,
    instructions: raw.instructions ?? [],
    questionIds: (raw.questions ?? []).map((q) => q.id),
    questionDetails: raw.questions ?? [],
  };
}
