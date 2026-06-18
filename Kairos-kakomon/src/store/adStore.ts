import { create } from 'zustand';

/**
 * Tracks what a non-VIP user has unlocked by watching ads.
 *
 * Two unlock granularities (per product spec):
 *  - Single question (相似题推荐里的超范围某道题): 看 1 次广告 → 永久解锁这一道题。
 *  - School × year (其他年份的整批考试题): 看 1 次广告 → 解锁该校+该年份，保持 24h。
 *
 * State is in-memory only for the MVP; persistence can be layered later.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

interface AdState {
  /** Question ids permanently unlocked via ad (single-question granularity). */
  unlockedQuestionIds: Record<string, true>;
  /** `${universityId}::${year}` → expiry timestamp (ms). 24h school×year unlock. */
  unlockedSchoolYears: Record<string, number>;

  unlockQuestion: (questionId: string) => void;
  unlockSchoolYear: (universityId: string, year: number) => void;

  isQuestionUnlocked: (questionId: string) => boolean;
  isSchoolYearUnlocked: (universityId: string, year: number) => boolean;
}

const schoolYearKey = (universityId: string, year: number) => `${universityId}::${year}`;

export const useAdStore = create<AdState>((set, get) => ({
  unlockedQuestionIds: {},
  unlockedSchoolYears: {},

  unlockQuestion: (questionId) =>
    set((s) => ({ unlockedQuestionIds: { ...s.unlockedQuestionIds, [questionId]: true } })),

  unlockSchoolYear: (universityId, year) =>
    set((s) => ({
      unlockedSchoolYears: {
        ...s.unlockedSchoolYears,
        [schoolYearKey(universityId, year)]: Date.now() + DAY_MS,
      },
    })),

  isQuestionUnlocked: (questionId) => !!get().unlockedQuestionIds[questionId],

  isSchoolYearUnlocked: (universityId, year) => {
    const expiry = get().unlockedSchoolYears[schoolYearKey(universityId, year)];
    return expiry != null && expiry > Date.now();
  },
}));

/** Non-reactive helpers for use inside policy functions / selectors. */
export const adUnlocks = {
  isQuestionUnlocked: (id: string) => useAdStore.getState().isQuestionUnlocked(id),
  isSchoolYearUnlocked: (uid: string, year: number) =>
    useAdStore.getState().isSchoolYearUnlocked(uid, year),
};
