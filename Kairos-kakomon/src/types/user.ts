export type UserPlan = 'free' | 'pro' | 'token';

export interface NextExam {
  name: string;
  date: string;        // ISO 8601 date "2026-08-25"
  durationDays: number;
}

export interface UserTargetSchool {
  universityId: string;
  type: 'daigakuin' | 'gakubu';
  gradSchool?: string;
  majorId?: string;
  subjects: string[];
  priority: number;
}

export type IdentityType = 'PHONE' | 'EMAIL' | 'WECHAT' | 'APPLE' | 'LINE';

export interface UserIdentity {
  type: IdentityType;
  value: string;
  verified: boolean;
  isPrimary: boolean;
  boundAt?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  phone?: string;
  major: string;
  bio?: string;
  avatarColor?: string;
  targetSchools: UserTargetSchool[];
  isPro: boolean;
  freeAiRemaining: number;
  tokenBalance: number;
  solvedCount: number;
  unclearCount: number;
  wrongCount: number;
  favoriteCount: number;
  aiAskCount: number;
  contributorPoints: number;
  weakPoints: WeakPoint[];
  nextExam?: NextExam;
  createdAt: string;
  /** 是否完成首次登录后的资料完善流程 */
  onboardingCompleted?: boolean;
  /** 是否已设置登录密码（来自后端 user_credential 表） */
  hasPassword?: boolean;
  /** 用户的全部登录身份，用于设置/绑定页判断哪些 type 已经绑定 */
  identities?: UserIdentity[];
}

/** 一条目标：大学 + 研究科 + 专攻。同一大学可有多条（不同研究科/专攻）。 */
export interface TargetEntry {
  universityId: string;
  gradSchool: string;   // '' 表示未指定研究科
  majorId?: string;
}

export interface EditTargetConfig {
  type: 'daigakuin' | 'gakubu';
  entries: TargetEntry[];
  subjects: string[];
  grad: string;
}

export interface WeakPoint {
  subject: string;
  point: string;
  level: 1 | 2 | 3 | 4 | 5;
  count: number;
}

export interface AiQuota {
  freeRemaining: number;
  tokenBalance: number;
  isPro: boolean;
  askCostToken: number;
  resetAt: string;
}
