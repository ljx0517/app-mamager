# Apple Store 集成技术方案

## 概述
本文档描述服务端与Apple Store集成的技术方案，包括App Store收据验证和Server Notifications Webhook。

## 技术栈选择

### 1. Apple Store Server API 库
**推荐**: `app-store-server-library` (Apple官方)
- 官方维护，功能完整
- 支持App Store Server API V2
- 提供TypeScript类型定义
- 包含JWT签名验证

**安装**:
```bash
pnpm add app-store-server-library
```

### 2. 缓存方案
**第一阶段**: 内存缓存 (简单实现)
- 使用Node.js内存缓存存储频繁查询的订阅状态
- 设置合理的TTL (如5分钟)

**第二阶段**: Redis缓存 (按需扩展)
- 当用户量增长时添加Redis
- 支持分布式部署

## 环境变量配置

### 必需环境变量
```bash
# Apple Store 配置
APPLE_ISSUER_ID=your-issuer-id           # Apple Issuer ID
APPLE_KEY_ID=your-key-id                 # App Store Connect API Key ID
APPLE_PRIVATE_KEY=your-private-key-base64 # Base64编码的私钥
APPLE_BUNDLE_ID=com.example.app          # App Bundle ID
APPLE_ENVIRONMENT=sandbox                # sandbox 或 production
```

### 可选环境变量
```bash
# 缓存配置
SUBSCRIPTION_CACHE_TTL=300               # 订阅状态缓存TTL（秒）
WEBHOOK_SIGNATURE_VERIFICATION=true      # 是否验证Webhook签名
```

## API接口规范

### 1. 收据验证接口 (`POST /trpc/subscription.verify`)

**请求**:
```typescript
{
  receiptData: string;      // App Store收据数据（Base64编码）
  productId: string;        // App Store产品ID
}
```

**响应**:
```typescript
{
  subscription: {
    id: string;
    tier: "free" | "pro_monthly" | "pro_yearly";
    status: "active" | "expired" | "cancelled" | "grace_period";
    originalTransactionId: string;  // Apple原始交易ID
    expiresAt: Date | null;
  };
  plan: {
    id: string;
    name: string;
  };
  message: string;
}
```

### 2. 订阅状态查询 (`GET /trpc/subscription.status`)

**请求**: 无参数（从上下文获取用户信息）

**响应**:
```typescript
{
  tier: "free" | "pro_monthly" | "pro_yearly";
  status: "active" | "expired" | "cancelled" | "grace_period";
  isPro: boolean;
  plan: {
    id: string;
    name: string;
    productId: string;
  } | null;
  expiresAt: Date | null;
  usage: {
    today: number;          // 今日使用量
    limit: number | null;   // 限制次数（免费用户）
  };
}
```

### 3. Webhook端点 (`POST /webhook/apple`)

**Apple通知类型**:
- `DID_CHANGE_RENEWAL_STATUS` - 续订状态变更
- `DID_RENEW` - 成功续订
- `EXPIRED` - 订阅过期
- `DID_FAIL_TO_RENEW` - 续订失败
- `GRACE_PERIOD_EXPIRED` - 宽限期结束
- `REFUND` - 退款

**处理逻辑**:
1. 验证JWS签名
2. 解析通知数据
3. 更新数据库订阅状态
4. 记录通知日志
5. 返回200 OK

## 实现步骤

### 第一阶段：收据验证集成
1. 安装依赖库
2. 添加环境变量配置
3. 创建Apple Store服务类
4. 实现收据验证逻辑
5. 替换现有TODO代码

### 第二阶段：Webhook实现
1. 创建Webhook路由
2. 实现签名验证
3. 添加通知处理器
4. 集成状态更新逻辑

### 第三阶段：优化和测试
1. 添加缓存机制
2. 编写单元测试
3. 创建集成测试
4. 性能优化

## 错误处理

### 常见错误场景
1. **无效收据** - 返回`INVALID_RECEIPT`错误
2. **网络超时** - 重试机制，返回`NETWORK_ERROR`
3. **证书过期** - 监控和告警机制
4. **Webhook签名无效** - 返回`INVALID_SIGNATURE`

### 错误响应格式
```typescript
{
  error: {
    code: string;      // 错误代码
    message: string;   // 错误描述
    details?: any;     // 错误详情
  }
}
```

## 安全考虑

### 1. 证书安全
- 私钥存储在环境变量中
- 生产环境使用密钥管理服务
- 定期轮换证书

### 2. Webhook安全
- 验证JWS签名
- 检查通知来源
- 记录所有Webhook请求

### 3. 数据安全
- 加密存储敏感数据
- 访问控制
- 审计日志

## 监控和日志

### 关键指标
1. 收据验证成功率
2. Webhook处理延迟
3. 订阅状态更新准确性
4. 缓存命中率

### 日志记录
1. 所有收据验证请求
2. Webhook通知处理
3. 订阅状态变更
4. 错误和异常

## 测试策略

### 单元测试
- Apple服务类方法测试
- 缓存逻辑测试
- 错误处理测试

### 集成测试
- 完整的收据验证流程
- Webhook通知处理
- 数据库状态更新

### 沙盒测试
- 使用Apple沙盒环境
- 模拟各种订阅场景
- 测试错误恢复

## 部署要求

### 环境配置
1. 设置正确的环境变量
2. 配置数据库连接
3. 设置日志和监控

### 健康检查
- `/health` - 服务健康状态
- `/health/db` - 数据库连接状态
- `/health/cache` - 缓存状态

## 后续优化

### 性能优化
1. 添加Redis缓存
2. 数据库查询优化
3. 异步处理Webhook

### 功能扩展
1. 支持Google Play Store
2. 多区域定价支持
3. 订阅分析报表

---

**版本**: 1.0.0
**创建日期**: 2026-02-14
**更新日期**: 2026-02-14