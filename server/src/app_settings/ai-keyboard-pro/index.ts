import { registerAppConfig } from '../registry.js';
import { customReplyRouter } from './routers/customReply.js';
import { keywordReplyRouter } from './routers/keywordReply.js';
import { keywordMatcher } from './services/KeywordMatcher.js';
import { appConfig, configMeta } from './config.js';

/**
 * ai-keyboard-pro 配置模块入口
 *
 * 此配置适用于 AI Keyboard 专业版
 * 包含功能：
 * - 自定义风格回复
 * - 关键词自动回复
 * - 快捷短语管理
 */

// 注册配置
registerAppConfig({
  configName: configMeta.configName,
  description: configMeta.description,

  // 专属路由
  // 挂载后访问路径：
  // - /trpc/ai-keyboard-pro.customReply.*
  // - /trpc/ai-keyboard-pro.keywordReply.*
  routers: {
    customReply: customReplyRouter,
    keywordReply: keywordReplyRouter,
  },

  // 专属服务
  services: [
    {
      name: 'keywordMatcher',
      instance: keywordMatcher,
    },
  ],

  // 配置
  config: appConfig,

  // REST 适配层路由（可选）
  // 挂载后访问路径：
  // - POST /api/aikeyboard/reply
  // - POST /api/aikeyboard/keyword/match
  restRoutes: [
    {
      method: 'POST',
      path: '/api/aikeyboard/reply',
      trpcPath: 'ai-keyboard-pro.customReply.generate',
      description: '生成自定义回复',
    },
    {
      method: 'POST',
      path: '/api/aikeyboard/keyword/match',
      trpcPath: 'ai-keyboard-pro.keywordReply.match',
      description: '关键词匹配',
    },
    {
      method: 'GET',
      path: '/api/aikeyboard/keyword/list',
      trpcPath: 'ai-keyboard-pro.keywordReply.list',
      description: '获取关键词列表',
    },
    {
      method: 'POST',
      path: '/api/aikeyboard/keyword/add',
      trpcPath: 'ai-keyboard-pro.keywordReply.add',
      description: '添加关键词',
    },
  ],
});
