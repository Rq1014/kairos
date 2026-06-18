import type { PaginatedResponse } from '@/types/api';
import type {
  AccentColor,
  ExamDifficulty,
  MajorOption,
  ProfessorDetail,
  ProfessorHighlight,
  RegionGroup,
  UniMajors,
  University,
  UniversityDimensions,
} from '@/types/university';
import { KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS } from '@/mocks/data';
import { apiRequest, ApiError } from './client';

export interface UniversityListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  regionGroup?: string;
  type?: 'national' | 'private';
}

export interface UniversityDetail extends University {
  gradSchools: string[];
  reviews: UniversityReview[];
  professors: ProfessorDetail[];
}

export interface UniversityReview {
  id: string;
  universityId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

export interface CreateUniversityReviewRequest {
  rating: number;
  title?: string;
  body: string;
  tags?: string[];
}

interface RawUniversity {
  id: string;
  nameCn?: string;
  nameJp: string;
  nameEn?: string;
  short: string;
  type: 'national' | 'private';
  region?: string;
  regionGroup?: string;
}

interface RawUniversityListResp {
  items: RawUniversity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  version?: number;
}

interface RawGradSchool {
  id: string;
  nameJp: string;
  nameCn?: string;
  category?: string;
}

interface RawMajor {
  id: string;
  label: string;
  short?: string;
  desc?: string;
  subjects?: string[];
}

const FALLBACK_DIMENSIONS: UniversityDimensions = {
  难度: 80,
  完整度: 70,
  透明度: 70,
  合格经验: 60,
  口碑: 70,
  资料丰富度: 60,
};

/** 后端字典只回基础字段；前端展示用的装饰字段从静态 mock 兜底。 */
function mergeWithMock(raw: RawUniversity): University {
  const mock = KAKOMON_UNIVERSITIES.find((u) => u.id === raw.id);
  return {
    id: raw.id,
    nameCn: raw.nameCn ?? mock?.nameCn ?? raw.nameJp,
    nameJp: raw.nameJp,
    nameEn: raw.nameEn ?? mock?.nameEn ?? raw.nameJp,
    short: raw.short,
    nickname: mock?.nickname,
    type: raw.type,
    region: raw.region ?? mock?.region ?? '',
    regionGroup: (raw.regionGroup as RegionGroup) ?? mock?.regionGroup ?? '首都圏',
    rating: mock?.rating ?? 4,
    examDifficulty: mock?.examDifficulty ?? ('medium' as ExamDifficulty),
    pastExamCount: mock?.pastExamCount ?? 0,
    reviewCount: mock?.reviewCount ?? 0,
    hotSubjects: mock?.hotSubjects ?? [],
    dimensions: mock?.dimensions ?? FALLBACK_DIMENSIONS,
    tags: mock?.tags ?? [],
    professorHighlights: mock?.professorHighlights ?? [],
    accent: (mock?.accent ?? 'blue') as AccentColor,
    suitableFor: mock?.suitableFor ?? '',
    logoUrl: mock?.logoUrl,
    qsRank: mock?.qsRank,
    domesticRank: mock?.domesticRank,
    subjectRanks: mock?.subjectRanks,
  };
}

function fallbackPaginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
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

function applyFiltersOnMock(items: University[], params: UniversityListParams = {}) {
  const keyword = params.keyword?.trim().toLowerCase();
  return items.filter((u) => {
    if (params.type && u.type !== params.type) return false;
    if (params.regionGroup && u.regionGroup !== params.regionGroup) return false;
    if (keyword) {
      const hay = `${u.nameCn} ${u.nameJp} ${u.nameEn} ${u.short} ${u.nickname ?? ''}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    return true;
  });
}

function professorFromHighlight(uni: University, h: ProfessorHighlight): ProfessorDetail {
  return {
    nameJp: h.name,
    nameRoman: h.name,
    university: uni.nameCn,
    lab: h.lab,
    title: '教授',
    since: 2010,
    direction: h.direction,
    recentTopics: [],
    aiSummary: null,
    admission: { yearly: 0, applyRatio: 0, passRate: 0 },
    publications: 0,
    relatedQuestions: [],
    experiences: [],
  };
}

export async function getUniversities(
  params?: UniversityListParams,
): Promise<PaginatedResponse<University>> {
  try {
    const data = await apiRequest<RawUniversityListResp>(`/api/dict/universities`, {
      method: 'GET',
      query: {
        regionGroup: params?.regionGroup,
        type: params?.type,
        keyword: params?.keyword,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      },
      skipAuth: true,
    });
    return {
      items: data.items.map(mergeWithMock),
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      hasMore: data.hasMore,
    };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // 网络异常时回退到 mock，保证页面可用
    const filtered = applyFiltersOnMock(KAKOMON_UNIVERSITIES, params);
    return fallbackPaginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
  }
}

export async function getUniversity(id: string): Promise<UniversityDetail> {
  try {
    interface RawDetail extends RawUniversity {
      gradSchools?: RawGradSchool[];
    }
    const data = await apiRequest<RawDetail>(`/api/dict/universities/${encodeURIComponent(id)}`, {
      method: 'GET',
      skipAuth: true,
    });
    const uni = mergeWithMock(data);
    const gradNames = (data.gradSchools ?? []).map((g) => g.nameJp);
    return {
      ...uni,
      gradSchools: gradNames.length ? gradNames : (UNI_GRADS[id] ?? []),
      reviews: [],
      professors: uni.professorHighlights.map((p) => professorFromHighlight(uni, p)),
    };
  } catch {
    const uni = KAKOMON_UNIVERSITIES.find((u) => u.id === id);
    if (!uni) throw new Error(`University not found: ${id}`);
    return {
      ...uni,
      gradSchools: UNI_GRADS[id] ?? [],
      reviews: [],
      professors: uni.professorHighlights.map((p) => professorFromHighlight(uni, p)),
    };
  }
}

export async function getUniversityGradSchools(
  id: string,
): Promise<{ universityId: string; items: string[] }> {
  try {
    const data = await apiRequest<{ universityId: string; items: RawGradSchool[] }>(
      `/api/dict/universities/${encodeURIComponent(id)}/grad-schools`,
      { method: 'GET', skipAuth: true },
    );
    return { universityId: id, items: (data.items ?? []).map((g) => g.nameJp) };
  } catch {
    return { universityId: id, items: UNI_GRADS[id] ?? [] };
  }
}

export async function getUniversityMajors(params?: {
  universityId?: string;
  gradSchool?: string;
}): Promise<
  | { universityId: string; gradSchool: string; items: MajorOption[] }
  | { items: UniMajors }
> {
  if (params?.universityId && params.gradSchool) {
    try {
      // 后端用 gradCode 查询，前端原 mock 用 nameJp。
      // 简化：直接传 nameJp，后端在 grad_school.code 等于 nameJp 的项目中匹配（需要 seed 时保持一致）。
      const gradCode = params.gradSchool;
      const data = await apiRequest<{ universityId: string; gradSchoolId: string; items: RawMajor[] }>(
        `/api/dict/grad-schools/${encodeURIComponent(gradCode)}/majors`,
        {
          method: 'GET',
          query: { universityCode: params.universityId },
          skipAuth: true,
        },
      );
      const items: MajorOption[] = (data.items ?? []).map((m) => ({
        id: m.id,
        label: m.label,
        short: m.short ?? '',
        desc: m.desc ?? '',
      }));
      return { universityId: params.universityId, gradSchool: params.gradSchool, items };
    } catch {
      const key = `${params.universityId}::${params.gradSchool}`;
      return {
        universityId: params.universityId,
        gradSchool: params.gradSchool,
        items: UNI_MAJORS[key] ?? [],
      };
    }
  }
  return { items: UNI_MAJORS };
}

// 以下接口后端 v1 字典模块不提供，保留 mock 兜底。
export async function getUniversityReviews(
  _id: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<UniversityReview>> {
  return fallbackPaginate<UniversityReview>([], params?.page ?? 1, params?.pageSize ?? 20);
}

export async function createUniversityReview(
  id: string,
  payload: CreateUniversityReviewRequest,
): Promise<UniversityReview> {
  return {
    id: `review-${Date.now()}`,
    universityId: id,
    authorName: '当前用户',
    rating: payload.rating,
    title: payload.title ?? '',
    body: payload.body,
    tags: payload.tags ?? [],
    createdAt: new Date().toISOString(),
  };
}

export async function getUniversityProfessors(
  id: string,
): Promise<{ items: ProfessorDetail[]; total: number }> {
  const uni = KAKOMON_UNIVERSITIES.find((u) => u.id === id);
  if (!uni) return { items: [], total: 0 };
  const items = uni.professorHighlights.map((p) => professorFromHighlight(uni, p));
  return { items, total: items.length };
}

export async function getProfessor(name: string): Promise<ProfessorDetail> {
  for (const uni of KAKOMON_UNIVERSITIES) {
    const hit = uni.professorHighlights.find((p) => p.name === name);
    if (hit) return professorFromHighlight(uni, hit);
  }
  throw new Error(`Professor not found: ${name}`);
}
