import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 收藏的过去问 id 集合（本地持久化）。
 *
 * 函数签名按未来后端接口设计：toggle → POST /questions/{id}/favorite。
 * 后端就绪后内部改为调用 api 即可，调用方不变。
 */

const STORAGE_KEY = 'kakomon_favorites_v1';

interface FavoritesState {
  ids: string[];
  isHydrated: boolean;

  isFavorite: (questionId: string) => boolean;
  toggle: (questionId: string) => void;
  hydrate: () => Promise<void>;
}

function persist(ids: string[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  isHydrated: false,

  isFavorite: (questionId) => get().ids.includes(questionId),

  toggle: (questionId) => {
    const exists = get().ids.includes(questionId);
    const ids = exists ? get().ids.filter((x) => x !== questionId) : [questionId, ...get().ids];
    set({ ids });
    persist(ids);
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        set({ ids: JSON.parse(saved) as string[], isHydrated: true });
        return;
      }
    } catch { /* keep default */ }
    set({ isHydrated: true });
  },
}));
