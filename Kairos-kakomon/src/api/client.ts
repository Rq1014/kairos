// HTTP Client：与后端 Spring Boot 服务通信
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';

export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'auth_refresh_token';

/**
 * 后端 BaseURL：
 *  - iOS 模拟器：http://localhost:8080
 *  - Android 模拟器：http://10.0.2.2:8080
 *  - 真机：替换为开发机 LAN IP（例如 http://192.168.1.5:8080）
 */
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL && process.env.EXPO_PUBLIC_API_BASE_URL.trim()) ||
  'http://127.0.0.1:8080';

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export class ApiError extends Error {
  code: number;
  data?: unknown;
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** 不要附带 Authorization */
  skipAuth?: boolean;
  /** 自定义额外头 */
  headers?: Record<string, string>;
  /** 不抛异常，返回原始 envelope（业务码非 0 也返回） */
  raw?: boolean;
}

async function loadToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * 读取响应里的 X-New-Access-Token / X-New-Refresh-Token,异步写回 SecureStore + zustand。
 * 服务端在 AuthInterceptor 滑动续签时下发,使「30 天有效期」从最后一次活跃开始计算。
 * 写入失败静默忽略 — 任何一步出错都不影响业务请求结果。
 */
function applySlidingTokens(resp: Response): void {
  const newAccess = resp.headers.get('x-new-access-token');
  const newRefresh = resp.headers.get('x-new-refresh-token');
  if (!newAccess && !newRefresh) return;
  // zustand 同步,后续 apiRequest 立刻能拿到新 token
  const auth = useAuthStore.getState();
  auth.setAuthTokens(
    newAccess ?? auth.token,
    newRefresh ?? auth.refreshToken,
  );
  if (newAccess) {
    SecureStore.setItemAsync(TOKEN_KEY, newAccess).catch(() => {});
  }
  if (newRefresh) {
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefresh).catch(() => {});
  }
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return url;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    usp.append(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...(opts.headers ?? {}),
  };
  if (!opts.skipAuth) {
    const token = await loadToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers,
  };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  }

  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (e: any) {
    throw new ApiError(-1, `网络异常：${e?.message ?? String(e)}`);
  }

  // 30 天滑动续签:服务端在 AuthInterceptor 中可能返回新的 access/refresh,
  // 客户端取出后写回 SecureStore + zustand。fire-and-forget,不阻塞主请求。
  applySlidingTokens(resp);

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await resp.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(-1, `服务异常：HTTP ${resp.status}`);
  }

  if (opts.raw) return envelope as unknown as T;

  if (envelope.code !== 0) {
    throw new ApiError(envelope.code, envelope.message ?? '请求失败', envelope.data);
  }
  return envelope.data;
}

export async function apiRaw<T = unknown>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  return apiRequest<ApiEnvelope<T>>(path, { ...opts, raw: true });
}
