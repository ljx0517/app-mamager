/**
 * Apple Store 模拟服务（开发用）
 * 当未配置真正的 Apple 证书时使用
 */

import type {
  AppleStoreConfig,
  AppleReceiptValidationResult,
  AppleNotification,
  IAppleStoreService,
  AppleEnvironment,
  AppleNotificationType,
} from './types.js';

export class MockAppleStoreService implements IAppleStoreService {
  private config: AppleStoreConfig;

  constructor(config: AppleStoreConfig) {
    this.config = config;
    console.log('📱 使用 Mock Apple Store 服务（开发模式）');
  }

  async verifyReceipt(receiptData: string, productId: string): Promise<AppleReceiptValidationResult> {
    console.log('🔍 Mock: 验证收据', { productId, receiptLength: receiptData.length });

    // 模拟验证逻辑
    if (this.config.skipVerification) {
      console.log('⚠️ Mock: 跳过收据验证（开发模式）');

      // 生成模拟的原始交易ID
      const originalTransactionId = `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 根据产品ID确定订阅时长
      let durationDays = 30; // 默认30天
      if (productId.includes('yearly')) {
        durationDays = 365;
      } else if (productId.includes('monthly')) {
        durationDays = 30;
      }

      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      return {
        isValid: true,
        originalTransactionId,
        productId,
        expiresAt,
        status: 'active',
        isInIntroOfferPeriod: false,
        isInPromotionalOfferPeriod: false,
        willAutoRenew: true,
        renewalPrice: {
          amount: productId.includes('yearly') ? 128 : 18,
          currency: 'CNY',
        },
      };
    }

    // 模拟验证失败
    return {
      isValid: false,
      originalTransactionId: '',
      productId,
      expiresAt: null,
      status: 'expired',
      isInIntroOfferPeriod: false,
      isInPromotionalOfferPeriod: false,
      willAutoRenew: false,
      error: {
        code: 'MOCK_ERROR',
        message: '模拟验证失败，请配置真正的 Apple 证书',
      },
    };
  }

  async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    console.log('🔐 Mock: 验证 Webhook 签名', { signatureLength: signature?.length || 0 });

    if (this.config.skipVerification) {
      console.log('⚠️ Mock: 跳过 Webhook 签名验证（开发模式）');
      return true;
    }

    // 模拟签名验证
    return signature?.startsWith('mock_signature_') || false;
  }

  async parseWebhookNotification(body: string): Promise<AppleNotification> {
    console.log('📨 Mock: 解析 Webhook 通知');

    try {
      const data = JSON.parse(body);

      // 确保有必要的字段
      return {
        notificationType: data.notificationType || 'DID_CHANGE_RENEWAL_STATUS',
        notificationUUID: data.notificationUUID || `mock_uuid_${Date.now()}`,
        data: {
          appAppleId: data.data?.appAppleId || 123456789,
          bundleId: data.data?.bundleId || this.config.bundleId,
          bundleVersion: data.data?.bundleVersion || '1.0.0',
          environment: data.data?.environment || this.config.environment,
          signedRenewalInfo: data.data?.signedRenewalInfo || 'mock_signed_renewal_info',
          signedTransactionInfo: data.data?.signedTransactionInfo || 'mock_signed_transaction_info',
          status: data.data?.status || 1,
          originalTransactionId: data.data?.originalTransactionId || `mock_txn_${Date.now()}`,
        },
        version: data.version || '2.0',
        signedDate: data.signedDate || Date.now(),
        subtype: data.subtype,
      };
    } catch (error) {
      console.error('❌ Mock: 解析 Webhook 通知失败', error);

      // 返回默认通知
      return {
        notificationType: 'TEST',
        notificationUUID: `mock_error_uuid_${Date.now()}`,
        data: {
          appAppleId: 123456789,
          bundleId: this.config.bundleId,
          bundleVersion: '1.0.0',
          environment: this.config.environment,
          signedRenewalInfo: 'mock_signed_renewal_info',
          signedTransactionInfo: 'mock_signed_transaction_info',
          status: 0,
          originalTransactionId: `mock_txn_${Date.now()}`,
        },
        version: '2.0',
        signedDate: Date.now(),
      };
    }
  }

  async getSubscriptionStatus(originalTransactionId: string): Promise<AppleReceiptValidationResult> {
    console.log('📊 Mock: 获取订阅状态', { originalTransactionId });

    // 模拟查询订阅状态
    const isActive = originalTransactionId.includes('active') || Math.random() > 0.3;
    const isExpired = originalTransactionId.includes('expired') || Math.random() > 0.7;

    let status: AppleReceiptValidationResult['status'] = 'active';
    let expiresAt: Date | null = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isExpired) {
      status = 'expired';
      expiresAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (originalTransactionId.includes('cancelled')) {
      status = 'cancelled';
      expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    } else if (originalTransactionId.includes('grace')) {
      status = 'grace_period';
      expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    return {
      isValid: isActive && !isExpired,
      originalTransactionId,
      productId: 'com.example.pro.monthly',
      expiresAt,
      status,
      isInIntroOfferPeriod: originalTransactionId.includes('trial'),
      isInPromotionalOfferPeriod: false,
      willAutoRenew: status === 'active' && !originalTransactionId.includes('cancelled'),
      renewalPrice: {
        amount: 18,
        currency: 'CNY',
      },
    };
  }

  /**
   * 创建模拟服务实例
   */
  static createMockService(): MockAppleStoreService {
    const config: AppleStoreConfig = {
      issuerId: 'mock-issuer-id',
      keyId: 'mock-key-id',
      privateKey: 'mock-private-key',
      bundleId: 'com.example.app',
      environment: 'sandbox',
      skipVerification: true,
    };

    return new MockAppleStoreService(config);
  }
}