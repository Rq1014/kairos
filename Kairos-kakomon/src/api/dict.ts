import type { MajorOption } from '@/types/university';
import { apiRequest } from './client';

// —— 后端 tree 原始形状（对应 UniversityTreeResponse.java，Jackson 序列化后）——
interface RawMajorNode {
  id: string;
  label: string;
  short?: string;
  desc?: string;
  subjects?: { code: string; nameJp: string }[];
}
interface RawGradNode {
  id: string;
  nameJp?: string;
  category?: string;
  majors?: RawMajorNode[];
}
interface RawUniNode {
  id: string;
  gradSchools?: RawGradNode[];
}
export interface RawTree {
  version?: number;
  universities?: RawUniNode[];
}

/** 规范化字典：形状与静态字典逐一对应，供 dictStore 直接采纳。 */
export interface NormalizedDict {
  gradsByUni: Record<string, string[]>;      // ≙ UNI_GRADS
  majorsByKey: Record<string, MajorOption[]>; // ≙ UNI_MAJORS，键 `uni::gradCode`
  gradNameMap: Record<string, string>;        // ≙ GRAD_SCHOOL_NAMES，键 `uni::gradCode`
  subjectsByKey: Record<string, { code: string; nameJp: string }[]>; // 键 `uni::gradCode::majorId`
  version: number;
}

/** 把后端 tree 拍平成规范化字典；坏节点跳过，不整体丢弃。 */
export function normalizeTree(raw: RawTree): NormalizedDict {
  const gradsByUni: Record<string, string[]> = {};
  const majorsByKey: Record<string, MajorOption[]> = {};
  const gradNameMap: Record<string, string> = {};
  const subjectsByKey: Record<string, { code: string; nameJp: string }[]> = {};

  for (const uni of raw.universities ?? []) {
    if (!uni || !uni.id) continue;
    const grads: string[] = [];
    for (const g of uni.gradSchools ?? []) {
      if (!g || !g.id) continue;
      grads.push(g.id);
      const key = `${uni.id}::${g.id}`;
      if (g.nameJp) gradNameMap[key] = g.nameJp;
      majorsByKey[key] = (g.majors ?? [])
        .filter((m) => m && m.id)
        .map((m) => {
          // 收集每个专业下的 subjects
          if (m.subjects && m.subjects.length > 0) {
            const subjKey = `${uni.id}::${g.id}::${m.id}`;
            subjectsByKey[subjKey] = m.subjects;
          }
          return {
            id: m.id,
            label: m.label ?? m.id,
            short: m.short ?? '',
            desc: m.desc ?? '',
          };
        });
    }
    gradsByUni[uni.id] = grads;
  }

  return { gradsByUni, majorsByKey, gradNameMap, subjectsByKey, version: raw.version ?? 0 };
}

/** 拉取字典版本号；失败抛 ApiError（调用方 catch 后静默降级）。 */
export async function fetchDictVersion(): Promise<number> {
  const data = await apiRequest<{ version: number }>('/api/dict/version', {
    method: 'GET',
    skipAuth: true,
  });
  return data?.version ?? 0;
}

/**
 * 拉取完整 tree 并规范化。
 * 返回 null 表示后端空树（items 为空）——调用方据此跳过覆盖，保护已有 seed/cache。
 */
export async function fetchDictTree(): Promise<NormalizedDict | null> {
  const raw = await apiRequest<RawTree>('/api/dict/universities/tree', {
    method: 'GET',
    skipAuth: true,
  });
  if (!raw || !Array.isArray(raw.universities) || raw.universities.length === 0) {
    return null;
  }
  return normalizeTree(raw);
}
