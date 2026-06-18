import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 模拟考试 / 专题学习 里「浏览」额外添加的学校 + 研究科。
 *
 * 与「目标校」(user.targetSchools) 区分：目标校是备考目标，享免费额度；
 * 浏览校只是用户想多看看的学校，超出免费范围按看广告 / Pro 解锁。
 *
 * 之前用组件内 useState 保存，导致离开页面再回来就丢失（#1 bug）。
 * 改为全局 store + 本地持久化，跨导航 / 重启都保留。
 */

const STORAGE_KEY = 'kakomon_browse_schools_v1';

export interface BrowseEntry {
  universityId: string;
  gradSchool: string;
}

const entryKey = (e: BrowseEntry) => `${e.universityId}::${e.gradSchool}`;

interface BrowseSchoolsState {
  entries: BrowseEntry[];
  isHydrated: boolean;

  add: (entry: BrowseEntry) => void;
  remove: (entry: BrowseEntry) => void;
  reorder: (entries: BrowseEntry[]) => void;
  hydrate: () => Promise<void>;
}

function persist(entries: BrowseEntry[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});
}

export const useBrowseSchoolsStore = create<BrowseSchoolsState>((set, get) => ({
  entries: [],
  isHydrated: false,

  add: (entry) => {
    if (get().entries.some((e) => entryKey(e) === entryKey(entry))) return;
    const entries = [...get().entries, entry];
    set({ entries });
    persist(entries);
  },

  remove: (entry) => {
    const entries = get().entries.filter((e) => entryKey(e) !== entryKey(entry));
    set({ entries });
    persist(entries);
  },

  reorder: (entries) => {
    set({ entries });
    persist(entries);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const entries = raw ? (JSON.parse(raw) as BrowseEntry[]) : [];
      set({ entries, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
