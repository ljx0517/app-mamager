import type { AppModuleConfig } from '../registry.js';

/**
 * common 默认配置
 *
 * 所有 App 的默认配置，不包含任何特色功能
 * 如果 App 没有指定 configName 或指定为 "common"，则使用此配置
 */
export const appConfig: AppModuleConfig = {
  // 功能开关 - 全部关闭
  features: {
    customReply: false,
    keywordReply: false,
    voiceInput: false,
    aiImage: false,
  },

  // 限制配置
  limits: {
    maxKeywordCount: 0,
    maxPhraseLength: 200,
    dailyGenerationLimit: 10,
  },

  // AI 配置
  ai: {
    defaultProvider: 'mock',
    fallbackProvider: 'mock',
    temperature: 0.7,
  },

  // 业务配置
  business: {
    trialDays: 0,
    defaultSubscriptionTier: 'free',
  },
};

/**
 * 配置元信息
 */
export const configMeta = {
  configName: 'common',
  description: '默认配置 - 不包含任何特色功能',
  version: '1.0.0',
};
