import type { UserPlan } from '@/types/user';
import { DEMO_USER } from '@/mocks/data';

export interface BillingStatus {
  isPro: boolean;
  plan: UserPlan;
  tokenBalance: number;
  freeAiRemaining: number;
  entitlements: {
    aiUnlimited: boolean;
    relatedLevel3: boolean;
    referenceIndex: boolean;
  };
  updatedAt: string;
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const plan: UserPlan = DEMO_USER.isPro ? 'pro' : 'free';
  return {
    isPro: DEMO_USER.isPro,
    plan,
    tokenBalance: DEMO_USER.tokenBalance,
    freeAiRemaining: DEMO_USER.freeAiRemaining,
    entitlements: {
      aiUnlimited: DEMO_USER.isPro,
      relatedLevel3: DEMO_USER.isPro,
      referenceIndex: DEMO_USER.isPro,
    },
    updatedAt: new Date().toISOString(),
  };
}
