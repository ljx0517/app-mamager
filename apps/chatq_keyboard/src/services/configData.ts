/**
 * ChatQ 主数据 API（场景、关系、标签维度、人设包）与本地缓存
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SceneItem,
  RelationItem,
  PersonaDimensionItem,
  PersonaPackageItem,
  ConfigDataCache,
} from '../types/configData';
import { getApiConfig } from './api';

const CACHE_KEY = 'chatq_config_data';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getTrpcUrl(procedure: string): string | null {
  const config = getApiConfig();
  if (!config?.baseUrl?.trim() || !config?.apiKey?.trim()) return null;
  const base = config.baseUrl.replace(/\/$/, '');
  const input = encodeURIComponent(JSON.stringify({}));
  return `${base}/trpc/${procedure}?input=${input}`;
}

async function fetchTrpc<T>(procedure: string): Promise<T> {
  const url = getTrpcUrl(procedure);
  if (!url) throw new Error('未配置 API（baseUrl + apiKey）');

  const config = getApiConfig()!;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`请求失败: ${res.status} ${text || res.statusText}`);
  }

  const json = (await res.json()) as unknown;
  if (json && typeof json === 'object' && 'error' in json && (json as { error?: { message?: string } }).error?.message) {
    throw new Error((json as { error: { message?: string } }).error.message);
  }
  const data =
    (json as { result?: { data?: T } }).result?.data ??
    (json as { result?: T }).result ??
    (json as { data?: T }).data ??
    json as T;
  return data;
}

async function getCached(): Promise<ConfigDataCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as ConfigDataCache;
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

async function setCached(cache: Omit<ConfigDataCache, 'fetchedAt'>): Promise<void> {
  await AsyncStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ ...cache, fetchedAt: Date.now() })
  );
}

/** 拉取并缓存全部主数据（未配置 API 时返回 null） */
export async function fetchConfigData(): Promise<ConfigDataCache | null> {
  if (!getApiConfig()?.baseUrl?.trim() || !getApiConfig()?.apiKey?.trim()) {
    return null;
  }
  try {
    const [scenes, relations, dimensions, personaPackages] = await Promise.all([
      fetchTrpc<SceneItem[]>('chatq.configData.listScenes'),
      fetchTrpc<RelationItem[]>('chatq.configData.listRelations'),
      fetchTrpc<PersonaDimensionItem[]>('chatq.configData.listPersonaDimensions'),
      fetchTrpc<PersonaPackageItem[]>('chatq.configData.listPersonaPackages'),
    ]);
    const cache: ConfigDataCache = {
      scenes: scenes ?? [],
      relations: relations ?? [],
      dimensions: dimensions ?? [],
      personaPackages: personaPackages ?? [],
      fetchedAt: Date.now(),
    };
    await setCached(cache);
    return cache;
  } catch (e) {
    console.warn('[configData] fetchConfigData failed', e);
    return null;
  }
}

/** 获取主数据：优先缓存，过期或缺失时拉取 */
export async function getConfigData(): Promise<ConfigDataCache | null> {
  const cached = await getCached();
  if (cached) return cached;
  return fetchConfigData();
}

export async function getScenes(): Promise<SceneItem[]> {
  const data = await getConfigData();
  return data?.scenes ?? [];
}

export async function getRelations(): Promise<RelationItem[]> {
  const data = await getConfigData();
  return data?.relations ?? [];
}

export async function getPersonaDimensions(): Promise<PersonaDimensionItem[]> {
  const data = await getConfigData();
  return data?.dimensions ?? [];
}

export async function getPersonaPackages(): Promise<PersonaPackageItem[]> {
  const data = await getConfigData();
  return data?.personaPackages ?? [];
}

/** 清除缓存，下次 get 会重新拉取 */
export async function clearConfigDataCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
