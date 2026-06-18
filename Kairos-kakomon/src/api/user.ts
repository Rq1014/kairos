import type {
  NextExam,
  UserProfile,
  UserTargetSchool,
} from '@/types/user';
import { apiRequest } from './client';

export interface UserStats {
  solvedCount: number;
  unclearCount: number;
  wrongCount: number;
  favoriteCount: number;
  aiAskCount: number;
  contributorPoints: number;
}

export interface PatchMeRequest {
  nickname?: string;
  major?: string;
  bio?: string;
  avatarColor?: string;
  selectedMajorCode?: string;
  nextExam?: NextExam | null;
  onboardingCompleted?: boolean;
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
  nextExam?: NextExam;
  createdAt: string;
  onboardingCompleted: boolean;
}

function adapt(raw: RawUserResp): UserProfile {
  return {
    id: raw.id,
    nickname: raw.nickname,
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
    createdAt: raw.createdAt,
    onboardingCompleted: !!raw.onboardingCompleted,
  };
}

export async function getMe(): Promise<UserProfile> {
  const data = await apiRequest<RawUserResp>(`/api/users/me`, { method: 'GET' });
  return adapt(data);
}

export async function patchMe(payload: PatchMeRequest): Promise<UserProfile> {
  const data = await apiRequest<RawUserResp>(`/api/users/me`, {
    method: 'PATCH',
    body: payload,
  });
  return adapt(data);
}

export async function updateTargetSchools(
  targetSchools: UserTargetSchool[],
): Promise<{ targetSchools: UserTargetSchool[] }> {
  const data = await apiRequest<RawUserResp>(`/api/users/me/target-schools`, {
    method: 'PUT',
    body: { schools: targetSchools },
  });
  return { targetSchools: adapt(data).targetSchools };
}
