import type { AppModuleConfig } from '../registry.js';

/**
 * ai-keyboard-pro 配置
 *
 * 此配置的特色功能：
 * 1. 键盘快捷回复 - 一键生成常用回复
 * 2. 关键词自动回复 - 根据关键词匹配预设回复
 * 3. 多风格生成 - 支持多种回复风格
 */
export const appConfig: AppModuleConfig = {
  // 功能开关
  features: {
    customReply: true,        // 自定义 AI 回复
    keywordReply: true,       // 关键词自动回复
    voiceInput: false,       // 语音输入（暂未支持）
    aiImage: false,          // AI 生图（暂未支持）
  },

  // 限制配置
  limits: {
    maxKeywordCount: 100,           // 最多关键词数
    maxPhraseLength: 500,           // 单条回复最大长度
    dailyGenerationLimit: 1000,      // 每日生成次数限制
  },

  // AI 配置
  ai: {
    defaultProvider: 'openai',       // 默认 AI 提供商
    fallbackProvider: 'mock',        // 降级提供商
    temperature: 0.7,               // 生成温度
  },

  // 业务配置
  business: {
    trialDays: 7,                   // 试用天数
    defaultSubscriptionTier: 'free', // 默认订阅等级
  },
};

/**
 * 配置元信息
 */
export const configMeta = {
  configName: 'ai-keyboard-pro',
  description: 'AI Keyboard 专业版配置 - 包含自定义回复和关键词自动回复功能',
  version: '1.0.0',
};
