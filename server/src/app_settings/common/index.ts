import { registerAppConfig } from '../registry.js';
import { appConfig, configMeta } from './config.js';

/**
 * common 默认配置模块入口
 *
 * 这是所有 App 的默认配置，不包含任何特色功能
 */

// 注册配置
registerAppConfig({
  configName: configMeta.configName,
  description: configMeta.description,

  // 无专属路由
  routers: {},

  // 无专属服务
  services: [],

  // 默认配置
  config: appConfig,
});
