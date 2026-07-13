import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MajorOption } from '@/types/university';
import {
  NormalizedDict,
  fetchDictVersion,
  fetchDictTree,
} from '@/api/dict';
import { UNI_GRADS, UNI_MAJORS, GRAD_SCHOOL_NAMES } from '@/mocks/data';

const STORAGE_KEY = 'kakomon_dict_v1';

interface DictState extends NormalizedDict {
  isHydrated: boolean;
  source: 'seed' | 'cache' | 'network';
  hydrate: () => Promise<void>;
}

/** 用静态字典构造初始 seed，使 store 从创建那刻起就非空（selector 永远同步有值）。 */
function buildSeed(): NormalizedDict {
  return {
    gradsByUni: { ...UNI_GRADS },
    majorsByKey: { ...UNI_MAJORS },
    gradNameMap: { ...GRAD_SCHOOL_NAMES },
    subjectsByKey: {},
    version: 0,
  };
}

function persist(dict: NormalizedDict) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dict)).catch(() => {});
}

/** 校验缓存形状，防止旧 schema 缓存污染。 */
function isValidCache(v: unknown): v is NormalizedDict {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return (
    typeof d.version === 'number' &&
    typeof d.gradsByUni === 'object' &&
    typeof d.majorsByKey === 'object' &&
    typeof d.gradNameMap === 'object'
  );
}

export const useDictStore = create<DictState>((set, get) => ({
  ...buildSeed(),
  isHydrated: false,
  source: 'seed',

  hydrate: async () => {
    // 1) 读缓存（上次后端数据），命中即覆盖 seed
    try {
      const rawCache = await AsyncStorage.getItem(STORAGE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (isValidCache(parsed)) {
          set({
            gradsByUni: parsed.gradsByUni,
            majorsByKey: parsed.majorsByKey,
            gradNameMap: parsed.gradNameMap,
            subjectsByKey: parsed.subjectsByKey ?? {},
            version: parsed.version,
            source: 'cache',
          });
        }
      }
    } catch {
      // 缓存读失败 → 保持 seed
    }
    set({ isHydrated: true });

    // 2) fire-and-forget 版本检查 + 按需拉 tree
    try {
      const remoteVersion = await fetchDictVersion();
      if (remoteVersion > get().version) {
        const fresh = await fetchDictTree();
        if (fresh) {
          set({
            gradsByUni: fresh.gradsByUni,
            majorsByKey: fresh.majorsByKey,
            gradNameMap: fresh.gradNameMap,
            subjectsByKey: fresh.subjectsByKey,
            version: fresh.version,
            source: 'network',
          });
          persist(fresh);
        }
      }
    } catch {
      // 版本/tree 请求失败 → 静默降级，保持 cache/seed
    }
  },
}));

// —— 对外同步 selector（普通函数，非 hook；命中 store 空时回退静态 seed）——

/** 研究科 code → 日文显示名（替代 mocks 的 gradName）。 */
export function dictGradName(uni: string, code: string): string {
  const key = `${uni}::${code}`;
  return get().gradNameMap[key] ?? GRAD_SCHOOL_NAMES[key] ?? code;
}

/** 某大学的研究科 code 列表（替代 UNI_GRADS[uni] ?? []）。 */
export function dictGrads(uni: string): string[] {
  return get().gradsByUni[uni] ?? UNI_GRADS[uni] ?? [];
}

/** 某大学某研究科下的专业列表（替代 UNI_MAJORS[`uni::grad`] ?? []）。 */
export function dictMajors(uni: string, gradCode: string): MajorOption[] {
  const key = `${uni}::${gradCode}`;
  return get().majorsByKey[key] ?? UNI_MAJORS[key] ?? [];
}

/** 某大学某研究科某专业下的科目列表（来自后端 tree subjects）。 */
export function dictSubjects(universityId: string, gradCode: string, majorId: string): { code: string; nameJp: string; questionCount?: number }[] {
  const key = `${universityId}::${gradCode}::${majorId}`;
  return get().subjectsByKey[key] ?? [];
}

function get() {
  return useDictStore.getState();
}