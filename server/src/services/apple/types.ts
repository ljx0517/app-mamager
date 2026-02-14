/**
 * Apple Store 服务类型定义
 */

/**
 * Apple 环境类型
 */
export type AppleEnvironment = 'sandbox' | 'production';

/**
 * Apple 收据验证结果
 */
export interface AppleReceiptValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 原始交易ID */
  originalTransactionId: string;
  /** 产品ID */
  productId: string;
  /** 订阅过期时间 */
  expiresAt: Date | null;
  /** 订阅状态 */
  status: 'active' | 'expired' | 'cancelled' | 'grace_period';
  /** 是否在试用期 */
  isInIntroOfferPeriod: boolean;
  /** 是否在促销期 */
  isInPromotionalOfferPeriod: boolean;
  /** 自动续订状态 */
  willAutoRenew: boolean;
  /** 续订价格 */
  renewalPrice?: {
    amount: number;
    currency: string;
  };
  /** 错误信息（如果验证失败） */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Apple Webhook 通知类型
 */
export type AppleNotificationType =
  | 'DID_CHANGE_RENEWAL_STATUS'
  | 'DID_RENEW'
  | 'EXPIRED'
  | 'DID_FAIL_TO_RENEW'
  | 'GRACE_PERIOD_EXPIRED'
  | 'REFUND'
  | 'CONSUMPTION_REQUEST'
  | 'RENEWAL_EXTENDED'
  | 'REVOKE'
  | 'TEST';

/**
 * Apple Webhook 通知数据
 */
export interface AppleNotification {
  /** 通知类型 */
  notificationType: AppleNotificationType;
  /** 订阅通知版本 */
  subtype?: string;
  /** 通知UUID */
  notificationUUID: string;
  /** 数据版本 */
  data: {
    /** App Apple ID */
    appAppleId: number;
    /** Bundle ID */
    bundleId: string;
    /** Bundle 版本 */
    bundleVersion: string;
    /** 环境 */
    environment: AppleEnvironment;
    /** 签名续订信息 */
    signedRenewalInfo: string;
    /** 签名交易信息 */
    signedTransactionInfo: string;
    /** 状态 */
    status: number;
    /** 原始交易ID */
    originalTransactionId: string;
  };
  /** 版本 */
  version: string;
  /** 签名时间 */
  signedDate: number;
}

/**
 * Apple Store 服务配置
 */
export interface AppleStoreConfig {
  /** Issuer ID */
  issuerId: string;
  /** Key ID */
  keyId: string;
  /** 私钥（Base64编码） */
  privateKey: string;
  /** Bundle ID */
  bundleId: string;
  /** 环境 */
  environment: AppleEnvironment;
  /** 是否跳过验证（开发用） */
  skipVerification?: boolean;
}

/**
 * Apple Store 服务接口
 */
export interface IAppleStoreService {
  /**
   * 验证 App Store 收据
   * @param receiptData Base64编码的收据数据
   * @param productId 产品ID
   * @returns 验证结果
   */
  verifyReceipt(receiptData: string, productId: string): Promise<AppleReceiptValidationResult>;

  /**
   * 验证 Webhook 签名
   * @param body 请求体
   * @param signature 签名头
   * @returns 是否有效
   */
  verifyWebhookSignature(body: string, signature: string): Promise<boolean>;

  /**
   * 解析 Webhook 通知
   * @param body 请求体
   * @returns 解析后的通知数据
   */
  parseWebhookNotification(body: string): Promise<AppleNotification>;

  /**
   * 获取订阅状态
   * @param originalTransactionId 原始交易ID
   * @returns 订阅状态信息
   */
  getSubscriptionStatus(originalTransactionId: string): Promise<AppleReceiptValidationResult>;
}