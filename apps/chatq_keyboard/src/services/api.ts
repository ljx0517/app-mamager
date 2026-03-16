import { GenerateRequest, GenerateResponse } from '../types';

/** API 客户端配置，用于对接 App Manager 后端 */
export interface ApiConfig {
  /** 后端 base URL，如 https://api.example.com */
  baseUrl: string;
  /** 应用 API Key（x-api-key） */
  apiKey: string;
  /** 设备标识（x-device-id），用于用户级认证 */
  deviceId: string;
  /** 用户 Token（可选，与 deviceId 二选一或同时用于 refresh） */
  userToken?: string;
}

let apiConfig: ApiConfig | null = null;

const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_TIMEOUT_MS = 30000;

/** 设置 API 配置；未设置或 apiKey 为空时仍使用 mock */
export function setApiConfig(config: ApiConfig | null): void {
  apiConfig = config;
}

/** 获取当前 API 配置 */
export function getApiConfig(): ApiConfig | null {
  return apiConfig;
}

/** 是否已配置为使用真实后端（baseUrl + apiKey 均有值） */
export function isRealApiConfigured(): boolean {
  return Boolean(apiConfig?.baseUrl?.trim() && apiConfig?.apiKey?.trim());
}

/** 保留：兼容旧调用，设置 baseUrl 时若未配置完整则仅更新 baseUrl */
export function setApiBaseUrl(url: string): void {
  if (!apiConfig) {
    apiConfig = { baseUrl: url, apiKey: '', deviceId: '' };
  } else {
    apiConfig = { ...apiConfig, baseUrl: url };
  }
}

export function getApiBaseUrl(): string {
  return apiConfig?.baseUrl ?? 'https://api.example.com';
}

/**
 * 从 fetch 响应中解析错误信息，供上层统一展示
 */
function parseApiError(response: Response, body: unknown): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error?: { message?: string; code?: string } }).error;
    if (err?.message) return err.message;
    if (err?.code) return `错误: ${err.code}`;
  }
  if (response.status === 401) return '未授权，请检查 API Key 或登录';
  if (response.status === 403) return '无权限或已超限';
  if (response.status === 404) return '接口不存在';
  if (response.status >= 500) return '服务器错误，请稍后重试';
  return `请求失败: ${response.status}`;
}

/**
 * 带重试的 fetch：仅对网络错误或 5xx 重试，重试时使用新的 request（不复用已 abort 的 signal）
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = DEFAULT_RETRY_COUNT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const signal = options.signal ?? controller.signal;

  try {
    const res = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    if (res.ok || retries === 0) return res;
    if (res.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      const { signal: _s, ...rest } = options;
      return fetchWithRetry(url, rest, retries - 1);
    }
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    const isRetryable =
      (e instanceof Error && e.name === "AbortError") ||
      (e instanceof TypeError && e.message === "Failed to fetch");
    if (isRetryable && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      const { signal: _s, ...rest } = options;
      return fetchWithRetry(url, rest, retries - 1);
    }
    throw e;
  }
}

/** 模拟 AI 回复（在未配置真实 API 时使用） */
async function mockGenerateReply(content: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const replies = [
    `好的，我理解您说的是："${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
    `收到您的消息：${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`,
    '感谢您的分享。基于您提供的内容，我会这样回复...',
    `我已收到：${content.slice(0, 20)}${content.length > 20 ? '...' : ''}。这是我的回复建议。`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成回复：已配置真实 API 时调用 ChatQ POST /api/aikeyboard/reply（支持人设/场景/关系/多候选），否则使用 mock
 */
export async function generateReply(request: GenerateRequest): Promise<GenerateResponse> {
  const {
    content,
    sceneId,
    relationId,
    personaTagWeights,
    candidateCount = 3,
  } = request;

  if (!content?.trim()) {
    throw new Error('内容不能为空');
  }

  if (!isRealApiConfigured() || !apiConfig) {
    const reply = await mockGenerateReply(content);
    return { reply };
  }

  const url = `${apiConfig.baseUrl.replace(/\/$/, '')}/api/aikeyboard/reply`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiConfig.apiKey,
    'x-device-id': apiConfig.deviceId,
  };
  if (apiConfig.userToken) {
    headers.Authorization = `Bearer ${apiConfig.userToken}`;
  }

  const body: Record<string, unknown> = {
    prompt: content.trim(),
    style: 'friendly',
    candidateCount: Math.min(3, Math.max(1, candidateCount ?? 1)),
  };
  if (sceneId) body.sceneId = sceneId;
  if (relationId) body.relationId = relationId;
  if (personaTagWeights && Object.keys(personaTagWeights).length > 0) {
    body.personaTagWeights = personaTagWeights;
  }

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { result?: string; candidates?: string[] };
    error?: { message?: string; code?: string };
  };

  if (!response.ok) {
    throw new Error(parseApiError(response, data));
  }

  if (data.success && data.data?.result != null) {
    return {
      reply: data.data.result,
      candidates: data.data.candidates,
    };
  }

  throw new Error(data.error?.message ?? '未返回有效回复');
}
