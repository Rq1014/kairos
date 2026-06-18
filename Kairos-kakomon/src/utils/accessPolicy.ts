import type { UserProfile, UserTargetSchool } from '@/types/user';
import { adUnlocks } from '@/store/adStore';

/**
 * Single source of truth for 过去问 access (VIP / 广告 paywall).
 *
 * Rules (per product spec, 2026-06):
 *  - VIP (isPro): 解锁全部学校 + 全部年份，无限制。
 *  - 非 VIP 免费范围: 已选目标研究科按 priority 前 3 个 × 最近 3 年(当前年-2 ~ 当前年)。
 *  - 超出免费范围: 默认锁定
 *      · 任意大学的某年份整批题     → 看广告解锁「该大学+该年份」，保持 24h
 *      · 相似题推荐里的某道题       → 看广告解锁「这一道题」(永久)
 */

export const FREE_TARGET_LIMIT = 3;
export const PRO_TARGET_LIMIT = 6;   // VIP 目标研究科上限
export const FREE_YEAR_SPAN = 3; // 当前年 及前两年

/** 该用户可选目标研究科上限：免费 3 个，VIP 6 个。 */
export function schoolLimit(user: Pick<UserProfile, 'isPro'>): number {
  return user.isPro ? PRO_TARGET_LIMIT : FREE_TARGET_LIMIT;
}

/** 免费可访问的最近年份下界（含）。动态按当前年计算。 */
export function freeYearFloor(now: Date = new Date()): number {
  return now.getFullYear() - (FREE_YEAR_SPAN - 1);
}

const targetKey = (universityId: string, gradSchool?: string) => `${universityId}::${gradSchool ?? ''}`;

/** 用户免费额度内的研究科 key 集合（已选目标研究科 priority 前 3 个）。 */
export function freeTargetKeys(user: Pick<UserProfile, 'targetSchools'>): string[] {
  return [...(user.targetSchools ?? [])]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, FREE_TARGET_LIMIT)
    .map((s: UserTargetSchool) => targetKey(s.universityId, s.gradSchool));
}

export type LockReason = 'school' | 'year' | 'both';

export interface AccessResult {
  /** 用户当前是否可直接查看（VIP / 免费范围内 / 已看广告解锁）。 */
  allowed: boolean;
  /** allowed=false 时，被锁的原因（学校超范围 / 年份超范围 / 两者）。 */
  reason: LockReason | null;
  /** 是否因 VIP 而解锁（用于 UI 文案区分）。 */
  viaVip: boolean;
  /** 是否因看广告而解锁（用于 UI 文案区分）。 */
  viaAd: boolean;
}

export interface QuestionAccessInput {
  universityId: string;
  /** 研究科名；免费额度按 大学+研究科 条目判定。 */
  gradSchool?: string;
  year: number;
  /** 该题 id —— 用于「单题级」广告解锁判定（相似题推荐场景）。 */
  questionId?: string;
}

/**
 * 判定某道过去问对该用户是否可访问。
 * 纯函数 + 读取 adStore 当前快照（非响应式）；UI 若需随解锁刷新，自行订阅 adStore。
 */
export function canAccessQuestion(
  user: Pick<UserProfile, 'isPro' | 'targetSchools'>,
  q: QuestionAccessInput,
  now: Date = new Date(),
): AccessResult {
  if (user.isPro) {
    return { allowed: true, reason: null, viaVip: true, viaAd: false };
  }

  // 单题级广告解锁（相似题推荐）优先：解锁即整题放行。
  if (q.questionId && adUnlocks.isQuestionUnlocked(q.questionId)) {
    return { allowed: true, reason: null, viaVip: false, viaAd: true };
  }

  const inFreeTarget = freeTargetKeys(user).includes(targetKey(q.universityId, q.gradSchool));
  const inFreeYear = q.year >= freeYearFloor(now);

  // 大学×年 24h 广告解锁：该大学该年份所有题放行，不按研究科限制。
  const adSchoolYear = adUnlocks.isSchoolYearUnlocked(q.universityId, q.year);
  if (adSchoolYear) {
    return { allowed: true, reason: null, viaVip: false, viaAd: true };
  }

  if (inFreeTarget && inFreeYear) {
    return { allowed: true, reason: null, viaVip: false, viaAd: false };
  }
  if (inFreeTarget && !inFreeYear) {
    return { allowed: false, reason: 'year', viaVip: false, viaAd: false };
  }
  // 研究科超范围（无论年份）：默认锁，原因沿用 school，表示目标范围超出。
  return {
    allowed: false,
    reason: inFreeYear ? 'school' : 'both',
    viaVip: false,
    viaAd: false,
  };
}

/** 便捷布尔判定。 */
export function isQuestionAccessible(
  user: Pick<UserProfile, 'isPro' | 'targetSchools'>,
  q: QuestionAccessInput,
  now: Date = new Date(),
): boolean {
  return canAccessQuestion(user, q, now).allowed;
}

/** 锁定原因 → 解锁所需动作的人类可读文案。 */
export function lockHint(reason: LockReason): string {
  switch (reason) {
    case 'year':
      return '看广告解锁该年份（24h）或升级 Pro';
    case 'school':
      return '该研究科超出免费 3 个研究科范围 · 看广告解锁该大学该年份或升级 Pro';
    case 'both':
      return '超出免费研究科与年份范围 · 看广告解锁该大学该年份或升级 Pro';
  }
}
