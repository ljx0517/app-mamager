/**
 * Apple Store 服务入口
 */

import type { AppleStoreConfig, IAppleStoreService } from './types.js';
import { MockAppleStoreService } from './mock-service.js';

/**
 * 检查是否配置了真正的 Apple 证书
 */
function hasValidAppleConfig(config: AppleStoreConfig): boolean {
  return (
    config.issuerId !== 'mock-issuer-id' &&
    config.keyId !== 'mock-key-id' &&
    config.privateKey !== 'mock-private-key' &&
    !config.issuerId.includes('your-') &&
    !config.keyId.includes('your-') &&
    !config.privateKey.includes('your-')
  );
}

/**
 * 从环境变量创建 Apple Store 配置
 */
export function createAppleStoreConfigFromEnv(): AppleStoreConfig {
  const issuerId = process.env.APPLE_ISSUER_ID || 'mock-issuer-id';
  const keyId = process.env.APPLE_KEY_ID || 'mock-key-id';
  const privateKey = process.env.APPLE_PRIVATE_KEY || 'mock-private-key';
  const bundleId = process.env.APPLE_BUNDLE_ID || 'com.example.app';
  const environment = (process.env.APPLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  const skipVerification = process.env.SKIP_APPLE_VERIFICATION === 'true';

  return {
    issuerId,
    keyId,
    privateKey,
    bundleId,
    environment,
    skipVerification,
  };
}

/**
 * 创建 Apple Store 服务实例
 * 根据配置决定使用真实服务还是模拟服务
 */
export function createAppleStoreService(config?: AppleStoreConfig): IAppleStoreService {
  const finalConfig = config || createAppleStoreConfigFromEnv();
  const shouldUseMock = !hasValidAppleConfig(finalConfig) || finalConfig.skipVerification;

  if (shouldUseMock) {
    console.log('🔄 使用 Mock Apple Store 服务（开发模式）');
    console.log('💡 提示：要使用真正的 Apple Store 服务，请配置以下环境变量：');
    console.log('   - APPLE_ISSUER_ID');
    console.log('   - APPLE_KEY_ID');
    console.log('   - APPLE_PRIVATE_KEY');
    console.log('   - APPLE_BUNDLE_ID');
    console.log('   - APPLE_ENVIRONMENT (sandbox/production)');

    return new MockAppleStoreService(finalConfig);
  }

  console.log('✅ 使用真正的 Apple Store 服务');

  // 这里将来会返回真正的 Apple Store 服务实例
  // 目前先返回模拟服务，等安装了真正的库后再实现
  return new MockAppleStoreService(finalConfig);
}

/**
 * 全局 Apple Store 服务实例
 */
let globalAppleStoreService: IAppleStoreService | null = null;

/**
 * 获取全局 Apple Store 服务实例（单例模式）
 */
export function getGlobalAppleStoreService(): IAppleStoreService {
  if (!globalAppleStoreService) {
    globalAppleStoreService = createAppleStoreService();
  }
  return globalAppleStoreService;
}

/**
 * 重置全局 Apple Store 服务实例（主要用于测试）
 */
export function resetGlobalAppleStoreService(): void {
  globalAppleStoreService = null;
}

// 导出类型
export type {
  AppleStoreConfig,
  AppleReceiptValidationResult,
  AppleNotification,
  IAppleStoreService,
  AppleEnvironment,
  AppleNotificationType,
} from './types.js';

// 导出模拟服务（主要用于测试）
export { MockAppleStoreService } from './mock-service.js';