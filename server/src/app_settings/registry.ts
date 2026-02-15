import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../trpc/router.js';
import type { Context } from '../trpc/context.js';

/**
 * App 专属服务接口
 */
export interface AppService {
  name: string;
  instance: unknown;
}

/**
 * App 配置接口
 */
export interface AppModuleConfig {
  /** 功能开关 */
  features: {
    customReply?: boolean;
    keywordReply?: boolean;
    voiceInput?: boolean;
    aiImage?: boolean;
  };
  /** 限制配置 */
  limits: {
    maxKeywordCount?: number;
    maxPhraseLength?: number;
    dailyGenerationLimit?: number;
  };
  /** AI 配置 */
  ai?: {
    defaultProvider?: string;
    fallbackProvider?: string;
    temperature?: number;
  };
  /** 业务配置 */
  business?: {
    trialDays?: number;
    defaultSubscriptionTier?: string;
  };
}

/**
 * App 配置模块接口
 * 每个配置通过实现此接口来注册自己的路由和服务
 *
 * 注意：一个配置可以被多个 App（bundleId）使用
 */
export interface AppConfigModule {
  /** 配置名称（唯一标识） */
  configName: string;
  /** 配置描述 */
  description?: string;
  /** 专属路由（会自动挂载） */
  routers: Record<string, unknown>;
  /** 专属服务 */
  services?: AppService[];
  /** 配置 */
  config: AppModuleConfig;
  /** REST 适配层路由（可选） */
  restRoutes?: RestRouteDefinition[];
}

/**
 * REST 路由定义
 */
export interface RestRouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  trpcPath: string;
  description?: string;
}

/**
 * App 配置注册表
 * 键：configName（配置名称）
 */
const configModules: Map<string, AppConfigModule> = new Map();

/**
 * 注册 App 配置模块
 * @param module 配置模块定义
 */
export function registerAppConfig(module: AppConfigModule): void {
  if (configModules.has(module.configName)) {
    console.warn(`[App Config] 配置 ${module.configName} 已注册，将被覆盖`);
  }
  configModules.set(module.configName, module);
  console.log(`[App Config] 已注册配置: ${module.configName}`);
}

/**
 * 根据配置名称获取配置模块
 */
export function getConfigModule(configName: string): AppConfigModule | undefined {
  return configModules.get(configName);
}

/**
 * 获取所有已注册的配置模块
 */
export function getAllConfigModules(): AppConfigModule[] {
  return Array.from(configModules.values());
}

/**
 * 获取所有配置名称列表
 */
export function getRegisteredConfigNames(): string[] {
  return Array.from(configModules.keys());
}

/**
 * 根据配置名称获取专属服务
 */
export function getAppService<T>(configName: string, serviceName: string): T | undefined {
  const config = configModules.get(configName);
  if (!config?.services) return undefined;
  const service = config.services.find(s => s.name === serviceName);
  return service?.instance as T | undefined;
}

/**
 * 获取配置
 */
export function getAppConfig(configName: string): AppModuleConfig | undefined {
  return configModules.get(configName)?.config;
}

/**
 * 获取所有配置的 REST 路由定义
 */
export function getAllRestRoutes(): RestRouteDefinition[] {
  const routes: RestRouteDefinition[] = [];
  for (const config of configModules.values()) {
    if (config.restRoutes) {
      routes.push(...config.restRoutes);
    }
  }
  return routes;
}

/**
 * 类型导出
 */
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * 扩展上下文类型 - 包含 App 专属服务
 */
export interface AppContext extends Context {
  /** App 专属服务映射 */
  appServices: Record<string, unknown>;
  /** App 配置 */
  appConfig: AppModuleConfig;
  /** 当前使用的配置名称 */
  configName: string;
}
