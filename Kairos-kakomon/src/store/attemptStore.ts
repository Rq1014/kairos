import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MasteryStatus } from '@/types/question';
import type { ExamResult, QuestionAttempt } from '@/types/attempt';

/**
 * 做题记录 / 考试成绩本地存储。
 *
 * 本地优先（AsyncStorage 持久化），函数签名按未来后端接口设计：
 *  recordAttempt / setAttemptResult / recordExamResult 对应后端
 *  POST /users/me/attempts、PATCH .../{id}、POST /users/me/exam-results。
 * 后端就绪后，这些方法内部改为调用 api 并以返回值回填即可，调用方不变。
 */

const STORAGE_KEY = 'kakomon_attempts_v1';

interface AttemptState {
  attempts: QuestionAttempt[];
  examResults: ExamResult[];
  isHydrated: boolean;

  /** 打开/开始一道题：写入一条 result=null 的记录，返回 attempt id。 */
  recordAttempt: (q: Omit<QuestionAttempt, 'id' | 'result' | 'attemptedAt'>) => string;
  /** 评价某次做题（我会/模糊/不会）。 */
  setAttemptResult: (attemptId: string, result: MasteryStatus) => void;
  /** 记录一场考试成绩。 */
  recordExamResult: (r: Omit<ExamResult, 'id' | 'takenAt'>) => string;

  /** 最近一次做题记录（用于「继续做题」模组）。 */
  lastAttempt: () => QuestionAttempt | null;
  /** 最近一次「未完成」(result=null) 的记录，优先于已完成项。 */
  lastUnfinished: () => QuestionAttempt | null;

  hydrate: () => Promise<void>;
}

function persist(state: Pick<AttemptState, 'attempts' | 'examResults'>) {
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ attempts: state.attempts, examResults: state.examResults }),
  ).catch(() => {});
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAttemptStore = create<AttemptState>((set, get) => ({
  attempts: [],
  examResults: [],
  isHydrated: false,

  recordAttempt: (q) => {
    // 去重：若已存在同题且未评价的记录，复用它（刷新时间并置顶），
    // 避免每次打开同一道题都新增一条「未完成」记录。
    const existing = get().attempts.find((a) => a.questionId === q.questionId && a.result === null);
    if (existing) {
      const refreshed: QuestionAttempt = { ...existing, ...q, attemptedAt: new Date().toISOString() };
      const attempts = [refreshed, ...get().attempts.filter((a) => a.id !== existing.id)];
      set({ attempts });
      persist({ attempts, examResults: get().examResults });
      return existing.id;
    }
    const id = genId();
    const attempt: QuestionAttempt = { ...q, id, result: null, attemptedAt: new Date().toISOString() };
    const attempts = [attempt, ...get().attempts];
    set({ attempts });
    persist({ attempts, examResults: get().examResults });
    return id;
  },

  setAttemptResult: (attemptId, result) => {
    const attempts = get().attempts.map((a) =>
      a.id === attemptId ? { ...a, result, attemptedAt: new Date().toISOString() } : a,
    );
    set({ attempts });
    persist({ attempts, examResults: get().examResults });
  },

  recordExamResult: (r) => {
    const id = genId();
    const result: ExamResult = { ...r, id, takenAt: new Date().toISOString() };
    const examResults = [result, ...get().examResults];
    set({ examResults });
    persist({ attempts: get().attempts, examResults });
    return id;
  },

  lastAttempt: () => get().attempts[0] ?? null,

  lastUnfinished: () => get().attempts.find((a) => a.result === null) ?? null,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { attempts?: QuestionAttempt[]; examResults?: ExamResult[] };
        set({
          attempts: parsed.attempts ?? [],
          examResults: parsed.examResults ?? [],
          isHydrated: true,
        });
        return;
      }
    } catch { /* keep defaults */ }
    set({ isHydrated: true });
  },
}));
