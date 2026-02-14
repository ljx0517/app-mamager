/**
 * 缓存工具 - 内存缓存实现
 * 用于缓存频繁访问的数据，如订阅状态
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // 过期时间戳（毫秒）
}

/**
 * 内存缓存类
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number; // 默认缓存时间（毫秒）

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 默认5分钟
    this.defaultTTL = defaultTTL;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 缓存时间（毫秒），可选，使用默认值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });

    // 清理过期缓存（惰性清理）
    this.cleanup();
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值或 undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清理所有过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计信息
   */
  stats(): {
    size: number;
    defaultTTL: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      defaultTTL: this.defaultTTL,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * 订阅状态缓存键生成器
 */
export class SubscriptionCacheKeys {
  /**
   * 生成用户订阅状态缓存键
   * @param userId 用户ID
   */
  static userSubscription(userId: string): string {
    return `subscription:user:${userId}`;
  }

  /**
   * 生成Apple交易ID缓存键
   * @param originalTransactionId Apple原始交易ID
   */
  static appleTransaction(originalTransactionId: string): string {
    return `apple:transaction:${originalTransactionId}`;
  }

  /**
   * 生成用户使用量缓存键
   * @param userId 用户ID
   * @param date 日期（YYYY-MM-DD格式）
   */
  static userUsage(userId: string, date: string): string {
    return `usage:user:${userId}:date:${date}`;
  }
}

/**
 * 全局缓存实例
 */
let globalCache: MemoryCache | null = null;

/**
 * 获取全局缓存实例（单例模式）
 */
export function getGlobalCache(): MemoryCache {
  if (!globalCache) {
    const ttl = parseInt(process.env.SUBSCRIPTION_CACHE_TTL || '300') * 1000; // 转换为毫秒
    globalCache = new MemoryCache(ttl);
    console.log(`🔄 初始化内存缓存，TTL: ${ttl / 1000}秒`);
  }
  return globalCache;
}

/**
 * 重置全局缓存实例（主要用于测试）
 */
export function resetGlobalCache(): void {
  globalCache = null;
}

/**
 * 缓存装饰器（方法级别）
 * @param ttl 缓存时间（毫秒）
 * @param keyGenerator 缓存键生成函数
 */
export function cached(
  ttl?: number,
  keyGenerator?: (...args: any[]) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = getGlobalCache();

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = keyGenerator
        ? keyGenerator.apply(this, args)
        : `cache:${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // 检查缓存
      const cachedValue = cache.get(cacheKey);
      if (cachedValue !== undefined) {
        return cachedValue;
      }

      // 执行原始方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}