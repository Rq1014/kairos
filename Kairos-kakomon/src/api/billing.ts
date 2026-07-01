// 会员/支付：对接后端 /api/billing/*（模拟支付）
import { apiRequest } from './client';

export type PlanCode = 'MONTHLY' | 'ANNUAL';
export type PayChannelCode = 'WECHAT' | 'ALIPAY' | 'APPLE';

export interface PlanInfo {
  plan: PlanCode;
  priceFen: number;
  durationDays: number;
  badge: string | null;
}

export interface OrderInfo {
  orderNo: string;
  status: string;
  plan: PlanCode;
  channel: PayChannelCode;
  amountFen: number;
  payParams: Record<string, unknown>;
}

export interface SubscriptionStatus {
  isPro: boolean;
  /** 'MONTHLY' | 'ANNUAL' | 'free' */
  plan: string;
  startsAt: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
}

/** 套餐列表（公开接口）。 */
export async function getPlans(): Promise<PlanInfo[]> {
  return apiRequest<PlanInfo[]>('/api/billing/plans', { skipAuth: true });
}

/** 当前订阅状态。 */
export async function getBillingStatus(): Promise<SubscriptionStatus> {
  return apiRequest<SubscriptionStatus>('/api/billing/status');
}

/** 下单（第一步）。 */
export async function createOrder(plan: PlanCode, channel: PayChannelCode): Promise<OrderInfo> {
  return apiRequest<OrderInfo>('/api/billing/orders', {
    method: 'POST',
    body: { plan, channel },
  });
}

/** 确认支付（第二步）。 */
export async function confirmOrder(orderNo: string): Promise<SubscriptionStatus> {
  return apiRequest<SubscriptionStatus>(`/api/billing/orders/${orderNo}/confirm`, {
    method: 'POST',
  });
}

/** 取消未支付订单。 */
export async function cancelOrder(orderNo: string): Promise<void> {
  await apiRequest<void>(`/api/billing/orders/${orderNo}/cancel`, { method: 'POST' });
}
