import type { UserProfile, IdentityType, UserIdentity } from '@/types/user';
import { apiRequest, ApiError } from './client';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
  /** 当前账号是否首次登录注册（需要完成资料填写） */
  isNew: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  nickname?: string;
}

export type VerifyCodeScene = 'LOGIN' | 'BIND' | 'UNBIND' | 'RESET_PASSWORD';

export interface SendCodeRequest {
  /** 旧入参：登录页传 `${phone}@phone.kakomon.local` 或邮箱，由 parseIdentifier 推断 */
  email?: string;
  /** 新入参：直接给 type+value，绑定/解绑场景使用 */
  identityType?: IdentityType;
  identityValue?: string;
  scene?: VerifyCodeScene;
}

export interface LoginWithCodeRequest {
  email: string;
  code: string;
  nickname?: string;
  /** 'phone' | 'email' — 用于推断默认填充字段 */
  identifierKind?: 'phone' | 'email';
  /** 原始用户输入（手机号或邮箱） */
  identifierRaw?: string;
}

export type AuthErrorCode =
  | 'USER_NOT_FOUND'
  | 'INVALID_CODE'
  | 'INVALID_CREDENTIALS'
  | 'IDENTITY_OCCUPIED'
  | 'IDENTITY_NOT_BOUND'
  | 'LAST_IDENTITY_FORBIDDEN'
  | 'PASSWORD_NOT_SET'
  | 'CODE_COOLDOWN'
  | 'UNKNOWN';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

interface RawUserResp {
  id: string;
  nickname: string;
  email: string;
  phone?: string;
  major: string;
  bio?: string;
  avatarColor?: string;
  avatarUrl?: string;
  selectedMajorCode?: string;
  targetSchools?: any[];
  isPro: boolean;
  freeAiRemaining: number;
  tokenBalance: number;
  solvedCount: number;
  unclearCount: number;
  wrongCount: number;
  favoriteCount: number;
  aiAskCount: number;
  contributorPoints: number;
  weakPoints?: any[];
  nextExam?: { name: string; date: string; durationDays: number };
  createdAt: string;
  onboardingCompleted: boolean;
  identities?: { type: string; value: string; verified: boolean; isPrimary: boolean; boundAt?: string }[];
  hasPassword?: boolean;
}

function adaptUser(raw: RawUserResp): UserProfile {
  const identities: UserIdentity[] | undefined = raw.identities?.map((i) => ({
    type: i.type as IdentityType,
    value: i.value,
    verified: !!i.verified,
    isPrimary: !!i.isPrimary,
    boundAt: i.boundAt,
  }));
  return {
    id: raw.id,
    nickname: raw.nickname ?? '小k',
    email: raw.email ?? '',
    phone: raw.phone,
    major: raw.major ?? '',
    bio: raw.bio,
    avatarColor: raw.avatarColor,
    targetSchools: (raw.targetSchools ?? []).map((s: any) => ({
      universityId: s.universityId,
      type: (s.type as 'daigakuin' | 'gakubu') ?? 'daigakuin',
      gradSchool: s.gradSchool ?? undefined,
      majorId: s.majorId ?? undefined,
      subjects: s.subjects ?? [],
      priority: s.priority ?? 1,
    })),
    isPro: !!raw.isPro,
    freeAiRemaining: raw.freeAiRemaining ?? 0,
    tokenBalance: raw.tokenBalance ?? 0,
    solvedCount: raw.solvedCount ?? 0,
    unclearCount: raw.unclearCount ?? 0,
    wrongCount: raw.wrongCount ?? 0,
    favoriteCount: raw.favoriteCount ?? 0,
    aiAskCount: raw.aiAskCount ?? 0,
    contributorPoints: raw.contributorPoints ?? 0,
    weakPoints: raw.weakPoints ?? [],
    nextExam: raw.nextExam,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    onboardingCompleted: !!raw.onboardingCompleted,
    hasPassword: !!raw.hasPassword,
    identities,
  };
}

interface RawLoginResp {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNew: boolean;
  user: RawUserResp;
}

function adaptLogin(raw: RawLoginResp): AuthResult {
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    expiresIn: raw.expiresIn,
    isNew: raw.isNew,
    user: adaptUser(raw.user),
  };
}

/**
 * 解析 identifier：兼容旧前端传入 `${phone}@phone.kakomon.local` 的伪邮箱。
 * 返回真正给后端的 identityType / identityValue。
 */
function parseIdentifier(opts: {
  email: string;
  identifierKind?: 'phone' | 'email';
  identifierRaw?: string;
}): { identityType: 'PHONE' | 'EMAIL'; identityValue: string } {
  const email = (opts.email ?? '').trim().toLowerCase();
  if (opts.identifierKind === 'phone' && opts.identifierRaw) {
    return { identityType: 'PHONE', identityValue: opts.identifierRaw.trim() };
  }
  if (email.endsWith('@phone.kakomon.local')) {
    const phone = email.replace(/@phone\.kakomon\.local$/, '');
    return { identityType: 'PHONE', identityValue: phone };
  }
  return { identityType: 'EMAIL', identityValue: email };
}

export async function isRegistered(email: string): Promise<boolean> {
  try {
    const { identityType, identityValue } = parseIdentifier({ email });
    const data = await apiRequest<{ registered: boolean }>(`/api/auth/identity/check`, {
      method: 'GET',
      query: { type: identityType, value: identityValue },
      skipAuth: true,
    });
    return !!data.registered;
  } catch {
    return false;
  }
}

export async function login(payload: LoginRequest): Promise<AuthResult> {
  const { identityType, identityValue } = parseIdentifier({ email: payload.email });
  try {
    const data = await apiRequest<RawLoginResp>(`/api/auth/login/password`, {
      method: 'POST',
      body: { identityType, identityValue, password: payload.password },
      skipAuth: true,
    });
    return adaptLogin(data);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 10101) throw new AuthError('USER_NOT_FOUND', e.message);
      if (e.code === 10103 || e.code === 10102) throw new AuthError('INVALID_CREDENTIALS', e.message);
      throw new AuthError('UNKNOWN', e.message);
    }
    throw e;
  }
}

export async function register(payload: RegisterRequest): Promise<AuthResult> {
  // v1 不再单独提供注册接口 —— 走「验证码登录」首登
  return loginWithCode({
    email: payload.email,
    code: '',
    nickname: payload.nickname,
  });
}

export async function sendVerificationCode(
  payload: SendCodeRequest,
): Promise<{ sent: true; debugCode: string }> {
  let identityType: IdentityType;
  let identityValue: string;
  if (payload.identityType && payload.identityValue) {
    identityType = payload.identityType;
    identityValue = payload.identityValue.trim();
  } else if (payload.email) {
    const parsed = parseIdentifier({ email: payload.email });
    identityType = parsed.identityType;
    identityValue = parsed.identityValue;
  } else {
    throw new AuthError('UNKNOWN', '缺少身份信息');
  }
  const scene = payload.scene ?? 'LOGIN';
  try {
    const data = await apiRequest<{ sent: boolean; cooldownSeconds: number; debugCode?: string }>(
      `/api/auth/verify-code`,
      {
        method: 'POST',
        body: { identityType, identityValue, scene },
        // 登录场景未登录态发码，绑定/解绑/重置密码场景必须带 token
        skipAuth: scene === 'LOGIN',
      },
    );
    return { sent: true, debugCode: data.debugCode ?? '' };
  } catch (e) {
    if (e instanceof ApiError && e.code === 10111) {
      throw new AuthError('CODE_COOLDOWN', e.message);
    }
    throw e;
  }
}

export async function bindIdentity(payload: {
  identityType: IdentityType;
  identityValue: string;
  code: string;
}): Promise<UserProfile> {
  try {
    const raw = await apiRequest<RawUserResp>(`/api/auth/bindings`, {
      method: 'POST',
      body: {
        identityType: payload.identityType,
        identityValue: payload.identityValue.trim(),
        code: payload.code,
      },
    });
    return adaptUser(raw);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 10110) throw new AuthError('INVALID_CODE', e.message);
      if (e.code === 10201) throw new AuthError('IDENTITY_OCCUPIED', e.message);
      throw new AuthError('UNKNOWN', e.message);
    }
    throw e;
  }
}

export async function unbindIdentity(payload: {
  identityType: IdentityType;
  code: string;
}): Promise<UserProfile> {
  try {
    const raw = await apiRequest<RawUserResp>(`/api/auth/bindings`, {
      method: 'DELETE',
      body: { identityType: payload.identityType, code: payload.code },
    });
    return adaptUser(raw);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 10110) throw new AuthError('INVALID_CODE', e.message);
      if (e.code === 10202) throw new AuthError('LAST_IDENTITY_FORBIDDEN', e.message);
      if (e.code === 10203) throw new AuthError('IDENTITY_NOT_BOUND', e.message);
      throw new AuthError('UNKNOWN', e.message);
    }
    throw e;
  }
}

export async function setPassword(payload: {
  oldPassword?: string;
  newPassword: string;
  code?: string;
}): Promise<UserProfile> {
  try {
    const raw = await apiRequest<RawUserResp>(`/api/auth/password`, {
      method: 'POST',
      body: {
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
        code: payload.code,
      },
    });
    return adaptUser(raw);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 10103) throw new AuthError('INVALID_CREDENTIALS', e.message);
      if (e.code === 10110) throw new AuthError('INVALID_CODE', e.message);
      if (e.code === 10102) throw new AuthError('PASSWORD_NOT_SET', e.message);
      throw new AuthError('UNKNOWN', e.message);
    }
    throw e;
  }
}

export async function loginWithCode(payload: LoginWithCodeRequest): Promise<AuthResult> {
  const { identityType, identityValue } = parseIdentifier({
    email: payload.email,
    identifierKind: payload.identifierKind,
    identifierRaw: payload.identifierRaw,
  });
  try {
    const data = await apiRequest<RawLoginResp>(`/api/auth/login/code`, {
      method: 'POST',
      body: {
        identityType,
        identityValue,
        code: payload.code,
      },
      skipAuth: true,
    });
    return adaptLogin(data);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 10110) throw new AuthError('INVALID_CODE', e.message);
      if (e.code === 10101) throw new AuthError('USER_NOT_FOUND', e.message);
      throw new AuthError('UNKNOWN', e.message);
    }
    throw e;
  }
}

/** onboarding / 资料更新统一入口（保留兼容签名） */
export async function updateUserProfile(
  _email: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile> {
  // 拆分到 patchMe + updateTargetSchools 由调用方自行选择。
  // 这里把所有「能 patch」的字段一次性 patch 上去。
  const patchBody: Record<string, unknown> = {};
  if (updates.nickname !== undefined) patchBody.nickname = updates.nickname;
  if (updates.bio !== undefined) patchBody.bio = updates.bio;
  if (updates.avatarColor !== undefined) patchBody.avatarColor = updates.avatarColor;
  if (updates.major !== undefined) patchBody.major = updates.major;
  if (updates.nextExam !== undefined) patchBody.nextExam = updates.nextExam;
  if (updates.onboardingCompleted !== undefined) patchBody.onboardingCompleted = updates.onboardingCompleted;

  const raw = await apiRequest<RawUserResp>(`/api/users/me`, {
    method: 'PATCH',
    body: patchBody,
  });
  let user = adaptUser(raw);

  if (updates.targetSchools !== undefined) {
    const data = await apiRequest<RawUserResp>(`/api/users/me/target-schools`, {
      method: 'PUT',
      body: { schools: updates.targetSchools },
    });
    user = adaptUser(data);
  }
  return user;
}

/** 仅替换当前用户的目标学校列表，全量语义；不会动 patchMe 的字段。 */
export async function replaceTargetSchools(schools: UserProfile['targetSchools']): Promise<UserProfile> {
  const data = await apiRequest<RawUserResp>(`/api/users/me/target-schools`, {
    method: 'PUT',
    body: { schools },
  });
  return adaptUser(data);
}

export async function refreshAuth(refreshToken: string): Promise<AuthResult> {
  const data = await apiRequest<RawLoginResp>(`/api/auth/refresh`, {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
  });
  return adaptLogin(data);
}

export async function logout(_refreshToken?: string): Promise<{ loggedOut: true }> {
  try {
    await apiRequest(`/api/auth/logout`, {
      method: 'POST',
      body: { all: false },
    });
  } catch {
    // ignore
  }
  return { loggedOut: true };
}

export interface DeactivateResult {
  userNo: string;
  deletedAt: string;
}

/**
 * 注销当前账号（软删除）。后端会清空 user_identity / user_credential / user_profile /
 * user_target_school，并把 user.status 置为 DELETED。同时作废当前 access/refresh token。
 *
 * 返回 userNo + deletedAt 仅做本地展示/日志使用，调用方应在成功后立即清空 SecureStore
 * 与 zustand 登录态，并跳转登录页。
 */
export async function deactivateAccount(): Promise<DeactivateResult> {
  return apiRequest<DeactivateResult>(`/api/users/me`, { method: 'DELETE' });
}
