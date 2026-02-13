// 导出类型
export * from "./types.js";

// 导入提供商
import { MockAIProvider } from "./providers/mock.js";
import { OpenAIProvider } from "./providers/openai.js";

// 导出提供商
export { BaseAIProvider } from "./providers/base.js";
export { MockAIProvider } from "./providers/mock.js";
export { OpenAIProvider } from "./providers/openai.js";

// 导出服务
export { AIService } from "./service.js";

// 导出提供商工厂
export type { AIProvider, AIProviderFactory } from "./types.js";

// 导入类型用于函数实现
import { AIService } from "./service.js";
import type { AIProviderConfig } from "../../db/schema.js";

/**
 * 创建默认的 AI 服务实例
 */
export function createDefaultAIService(): AIService {
  const service = new AIService({
    enableCache: process.env.NODE_ENV === "production",
    verbose: process.env.NODE_ENV === "development",
  });

  // 注册提供商工厂
  service.registerProvider("mock", (config: AIProviderConfig) => new MockAIProvider(config));
  service.registerProvider("openai", (config: AIProviderConfig) => new OpenAIProvider(config));
  // 注意：需要安装相应的 SDK 才能启用以下提供商
  // service.registerProvider("anthropic", (config) => new AnthropicProvider(config));
  // service.registerProvider("google", (config) => new GoogleAIProvider(config));
  // service.registerProvider("azure_openai", (config) => new AzureOpenAIProvider(config));

  return service;
}

/**
 * 初始化 App 的 AI 配置
 */
export function initializeAppAIConfig(service: AIService, appId: string, appSettings: any): void {
  service.initializeApp(appId, appSettings);
}

/**
 * 全局 AI 服务实例（单例模式）
 */
let globalAIService: AIService | null = null;

/**
 * 获取全局 AI 服务实例
 */
export function getGlobalAIService(): AIService {
  if (!globalAIService) {
    globalAIService = createDefaultAIService();
    console.log("[AIService] 已创建全局 AI 服务实例");
  }
  return globalAIService;
}

/**
 * 设置全局 AI 服务实例
 */
export function setGlobalAIService(service: AIService): void {
  globalAIService = service;
  console.log("[AIService] 已设置全局 AI 服务实例");
}

/**
 * 重置全局 AI 服务实例
 */
export function resetGlobalAIService(): void {
  globalAIService = null;
  console.log("[AIService] 已重置全局 AI 服务实例");
}