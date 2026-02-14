# 多应用管理平台 API 文档

## 📋 文档概览

本文档描述了多应用管理平台的后端 API 接口，采用 **Fastify + tRPC** 架构，为 iOS 应用（AI Keyboard 等）提供统一的后台服务。

### 服务信息
- **服务地址**: `http://localhost:3000`（开发环境）
- **API 前缀**: `/trpc`
- **健康检查**: `GET /health`
- **版本**: 0.6.0
- **技术栈**: Fastify + tRPC + Drizzle ORM + PostgreSQL

### 认证体系
系统采用四级认证层级，按权限从低到高：

| 层级 | 认证要求 | 使用场景 |
|------|----------|----------|
| **public** | 无需认证 | 管理员登录、系统初始化 |
| **app** | `x-api-key`（App 级别） | 客户端首次注册、邮箱验证 |
| **protected** | `x-api-key` + `x-device-id` 或 JWT | 用户相关操作、AI 功能 |
| **admin** | 管理员 JWT Token | 管理后台所有操作 |

### 请求头示例
```http
# App 级别认证
x-api-key: app_xxxxxx

# 用户级别认证（传统方式）
x-api-key: app_xxxxxx
x-device-id: device_12345

# 用户级别认证（JWT 方式）
x-api-key: app_xxxxxx
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 管理员认证
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 接口总览

- **总接口数**: 83 个（tRPC 接口 82 个 + 健康检查 1 个）
- **认证分布**: public(2) / app(11) / protected(13) / admin(56)
- **HTTP 方法**: GET(20) / POST(62)

## 🗂️ 详细接口列表

### 1. 健康检查
| 接口 | 方法 | 认证 | 路径 | 说明 |
|------|------|------|------|------|
| 健康检查 | GET | 无需 | `/health` | 检查服务状态 |

**请求示例**:
```bash
curl http://localhost:3000/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T23:41:00.000Z",
  "service": "Multi-App Management Server",
  "version": "0.6.0"
}
```

---

### 2. 管理员认证与管理 (`admin.*`)

#### `admin.login` - 管理员登录
| 属性 | 值 |
|------|-----|
| **认证** | publicProcedure |
| **方法** | POST |
| **路径** | `/trpc/admin.login` |
| **功能** | 管理员登录，返回 JWT Token |

**请求参数**:
```typescript
{
  username: string;  // 用户名
  password: string;  // 密码
}
```

**响应**:
```typescript
{
  token: string;  // JWT Token
  admin: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "super_admin";
  }
}
```

#### `admin.create` - 创建管理员
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/admin.create` |
| **功能** | 创建新管理员（仅 super_admin 可操作） |

**请求参数**:
```typescript
{
  username: string;
  email: string;
  password: string;
  role?: "super_admin" | "admin";  // 默认 "admin"
}
```

#### `admin.me` - 获取当前管理员信息
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/admin.me` |
| **功能** | 获取当前登录的管理员信息 |

**响应**:
```typescript
{
  id: string;
  username: string;
  email: string;
  role: "admin" | "super_admin";
  createdAt: Date;
}
```

#### `admin.refresh` - 刷新管理员 Token
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/admin.refresh` |
| **功能** | 刷新当前管理员的 JWT Token |

#### `admin.init` - 初始化系统
| 属性 | 值 |
|------|-----|
| **认证** | publicProcedure |
| **方法** | POST |
| **路径** | `/trpc/admin.init` |
| **功能** | 初始化系统，创建首个超级管理员（仅当系统无管理员时可用） |

**请求参数**:
```typescript
{
  username: string;
  email: string;
  password: string;
}
```

---

### 3. 应用管理 (`app.*`)

#### `app.create` - 创建新应用
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/app.create` |
| **功能** | 创建新应用，生成唯一的 API Key 和 Secret |

**请求参数**:
```typescript
{
  name: string;                    // 应用名称
  bundleId: string;                // 包标识（如 com.example.app）
  platform?: "ios" | "android" | "web";  // 平台类型
  description?: string;            // 应用描述
  settings?: {                     // 应用配置
    aiProvider?: "openai" | "mock";
    defaultModel?: string;
    usageLimit?: number;
    // 其他配置...
  };
}
```

**响应**:
```typescript
{
  app: {
    id: string;
    name: string;
    apiKey: string;      // App 级别的 API Key（客户端使用）
    apiSecret: string;   // 仅服务器端可见
    bundleId: string;
    platform: string;
    // 其他字段...
  };
  message: string;
}
```

#### `app.list` - 获取应用列表
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/app.list` |
| **功能** | 获取所有注册的应用列表 |

**响应**: `App[]` 数组

#### `app.detail` - 获取应用详情
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/app.detail` |
| **功能** | 获取单个应用的详细信息，包含用户统计 |

**请求参数**:
```typescript
{
  id: string;  // 应用 ID
}
```

**响应**:
```typescript
App & {
  stats: {
    userCount: number;  // 该应用的用户总数
  }
}
```

#### `app.update` - 更新应用信息
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/app.update` |
| **功能** | 更新应用的名称、描述、状态等 |

#### `app.regenerateKey` - 重新生成 API Key
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/app.regenerateKey` |
| **功能** | 重新生成 API Key（旧的立即失效） |

#### `app.delete` - 删除应用
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/app.delete` |
| **功能** | 删除应用及所有关联数据（仅 super_admin 可操作） |

---

### 4. 用户管理 (`user.*`)

#### `user.register` - 设备注册
| 属性 | 值 |
|------|-----|
| **认证** | appProcedure |
| **方法** | POST |
| **路径** | `/trpc/user.register` |
| **功能** | 设备首次注册（客户端首次启动时调用） |

**请求参数**:
```typescript
{
  deviceId: string;      // 设备唯一标识（必需）
  email?: string;        // 邮箱（可选，后续可绑定）
  password?: string;     // 密码（可选，邮箱注册时需要）
}
```

**响应**:
```typescript
{
  user: User;            // 用户信息
  isNew: boolean;        // 是否为新用户
  message: string;
}
```

#### `user.me` - 获取当前用户信息
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | GET |
| **路径** | `/trpc/user.me` |
| **功能** | 获取当前登录用户的完整信息，包含订阅状态 |

**响应**:
```typescript
User & {
  subscription: Subscription | null;  // 用户订阅状态（如有）
}
```

#### `user.loginWithEmail` - 邮箱登录
| 属性 | 值 |
|------|-----|
| **认证** | appProcedure |
| **方法** | POST |
| **路径** | `/trpc/user.loginWithEmail` |
| **功能** | 使用邮箱和密码登录 |

**请求参数**:
```typescript
{
  email: string;     // 邮箱地址
  password: string;  // 密码
}
```

**响应**:
```typescript
{
  success: boolean;
  token: string;     // 用户 JWT Token
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    deviceId: string | null;
  };
  message: string;
}
```

#### `user.registerWithEmail` - 邮箱注册
| 属性 | 值 |
|------|-----|
| **认证** | appProcedure |
| **方法** | POST |
| **路径** | `/trpc/user.registerWithEmail` |
| **功能** | 使用邮箱注册新用户，自动发送验证邮件 |

#### `user.verifyEmail` - 验证邮箱
| 属性 | 值 |
|------|-----|
| **认证** | appProcedure |
| **方法** | POST |
| **路径** | `/trpc/user.verifyEmail` |
| **功能** | 验证邮箱验证码 |

**请求参数**:
```typescript
{
  token: string;  // 邮箱验证 Token
}
```

#### `user.updateProfile` - 更新用户资料
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/user.updateProfile` |
| **功能** | 更新用户的邮箱、设备 ID 等信息 |

**请求参数**:
```typescript
{
  email?: string;     // 新邮箱（如需修改）
  deviceId?: string;  // 新设备 ID（如需修改）
}
```

**其他用户接口**:
- `user.refresh` - 刷新用户 Token
- `user.resendVerificationEmail` - 重新发送验证邮件
- `user.requestPasswordReset` - 请求密码重置邮件
- `user.resetPassword` - 重置密码
- `user.updatePassword` - 修改密码（需要当前密码）

---

### 5. AI 功能 (`ai.*`)

#### `ai.generate` - 生成 AI 回复
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/ai.generate` |
| **功能** | 生成 AI 回复，受用户用量限制 |

**请求参数**:
```typescript
{
  text: string;                // 输入文本
  stylePrompt?: string;        // 风格提示词
  temperature?: number;        // 生成温度（0-1）
  maxTokens?: number;          // 最大 Token 数
  candidateCount?: number;     // 候选回复数量
}
```

**响应**:
```typescript
{
  replies: string[];  // AI 生成的回复列表
  usage: {
    today: number;      // 今日已用量
    limit: number | null;  // 用量限制（null 表示无限）
    isPro: boolean;     // 是否为 Pro 用户
  };
  provider: string;    // 使用的 AI 提供商（如 "openai"）
}
```

#### `ai.models` - 获取 AI 模型列表
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | GET |
| **路径** | `/trpc/ai.models` |
| **功能** | 获取当前可用的 AI 模型列表 |

**响应**:
```typescript
Array<{
  id: string;           // 模型 ID
  name: string;         // 模型名称
  description: string;  // 模型描述
  isPro: boolean;       // 是否为 Pro 专用模型
}>
```

---

### 6. 说话风格管理 (`style.*`)

#### `style.builtinList` - 获取内置风格列表
| 属性 | 值 |
|------|-----|
| **认证** | appProcedure |
| **方法** | GET |
| **路径** | `/trpc/style.builtinList` |
| **功能** | 获取当前应用的所有内置风格列表 |

**响应**: `Style[]` 数组

#### `style.userList` - 获取用户自定义风格
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | GET |
| **路径** | `/trpc/style.userList` |
| **功能** | 获取当前用户的自定义风格列表 |

#### `style.create` - 创建自定义风格
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/style.create` |
| **功能** | 创建用户自定义的说话风格 |

**请求参数**:
```typescript
{
  name: string;                // 风格名称
  description?: string;        // 风格描述
  icon?: string;               // 图标标识
  color?: string;              // 主题颜色
  prompt: string;              // AI 提示词
  temperature?: number;        // 生成温度
  maxTokens?: number;          // 最大 Token 数
}
```

**响应**: `Style` 对象

#### `style.update` - 更新自定义风格
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/style.update` |
| **功能** | 更新用户自定义风格 |

#### `style.delete` - 删除自定义风格
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/style.delete` |
| **功能** | 删除用户自定义风格 |

**请求参数**:
```typescript
{
  id: string;  // 风格 ID
}
```

---

### 7. 订阅管理（后台）(`subscriptionManage.*`)

#### `subscriptionManage.createPlan` - 创建订阅计划
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/subscriptionManage.createPlan` |
| **功能** | 为指定应用创建新的订阅计划 |

**请求参数**:
```typescript
{
  appId: string;                    // 应用 ID
  name: string;                     // 计划名称
  productId: string;                // 应用商店产品 ID
  tier?: "free" | "pro_monthly" | "pro_yearly";  // 套餐层级
  billingPeriod?: "monthly" | "yearly" | "lifetime" | "custom";  // 计费周期
  priceCents: number;               // 价格（分）
  currency?: string;                // 货币（默认 "USD"）
  durationDays: number;             // 有效期（天）
  description?: string;             // 计划描述
  features?: string[];              // 功能列表
  isActive?: boolean;               // 是否激活
  sortOrder?: number;               // 显示顺序
}
```

#### `subscriptionManage.listPlans` - 获取订阅计划列表
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/subscriptionManage.listPlans` |
| **功能** | 获取指定应用的所有订阅计划 |

#### `subscriptionManage.listSubscriptions` - 查看用户订阅列表
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/subscriptionManage.listSubscriptions` |
| **功能** | 查看指定应用的所有用户订阅，支持分页和筛选 |

**请求参数**:
```typescript
{
  appId: string;                    // 应用 ID
  status?: "active" | "expired" | "cancelled" | "grace_period";  // 状态筛选
  tier?: "free" | "pro_monthly" | "pro_yearly";                  // 套餐筛选
  limit?: number;                  // 每页数量
  offset?: number;                 // 偏移量
}
```

**响应**:
```typescript
{
  items: Array<{
    subscription: Subscription;
    user: User;
    plan: SubscriptionPlan;
  }>;
  total: number;    // 总记录数
  limit: number;    // 每页数量
  offset: number;   // 当前偏移
}
```

#### `subscriptionManage.stats` - 获取订阅统计数据
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/subscriptionManage.stats` |
| **功能** | 获取指定应用的订阅统计数据 |

**响应**:
```typescript
{
  totalUsers: number;                    // 总用户数
  activePlans: number;                   // 活跃计划数
  byStatus: {                            // 按状态统计
    active: number;
    expired: number;
    cancelled: number;
    gracePeriod: number;
  };
  byTier: {                              // 按套餐统计
    free: number;
    proMonthly: number;
    proYearly: number;
  };
  conversionRate: string;                // 转化率（如 "15.5%"）
}
```

**其他订阅管理接口**:
- `subscriptionManage.updatePlan` - 更新订阅计划
- `subscriptionManage.deletePlan` - 删除订阅计划
- `subscriptionManage.activateSubscription` - 手动激活用户订阅
- `subscriptionManage.cancelSubscription` - 手动取消用户订阅
- `subscriptionManage.extendSubscription` - 延长用户订阅

---

### 8. 订阅功能（客户端）(`subscription.*`)

#### `subscription.plans` - 获取订阅计划
| 属性 | 值 |
|------|-----|
| **认证** | appProcedure |
| **方法** | GET |
| **路径** | `/trpc/subscription.plans` |
| **功能** | 获取当前应用的可用订阅计划列表（客户端展示用） |

**响应**:
```typescript
Array<{
  id: string;
  name: string;
  productId: string;      // 应用商店产品 ID
  tier: string;           // 套餐层级
  billingPeriod: string;  // 计费周期
  priceCents: number;     // 价格（分）
  currency: string;       // 货币
  durationDays: number;   // 有效期（天）
  description: string;    // 描述
  features: string[];     // 功能列表
}>
```

#### `subscription.verify` - 验证购买收据
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/subscription.verify` |
| **功能** | 验证 App Store/Google Play 收据并激活订阅 |

**请求参数**:
```typescript
{
  receiptData: string;  // 应用商店收据数据
  productId: string;    // 产品 ID
}
```

**响应**:
```typescript
{
  subscription: Subscription;  // 激活的订阅信息
  plan: {
    id: string;
    name: string;
  };
  message: string;
}
```

#### `subscription.status` - 查询订阅状态
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | GET |
| **路径** | `/trpc/subscription.status` |
| **功能** | 查询当前用户的订阅状态 |

**响应**:
```typescript
{
  tier: string;                     // 套餐层级
  status: string;                   // 状态（active/expired等）
  isPro: boolean;                   // 是否为 Pro 用户
  plan: {                           // 当前订阅计划（如有）
    id: string;
    name: string;
    billingPeriod: string;
  } | null;
  expiresAt: Date | null;           // 过期时间
}
```

#### `subscription.restore` - 恢复购买
| 属性 | 值 |
|------|-----|
| **认证** | protectedProcedure |
| **方法** | POST |
| **路径** | `/trpc/subscription.restore` |
| **功能** | 恢复用户之前的购买（占位功能） |

---

### 9. 用户管理（后台）(`userManage.*`)

管理指定应用下的用户账户，支持列表查询、详情查看、状态管理操作。

#### `userManage.list` - 获取用户列表
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/userManage.list` |
| **功能** | 获取用户列表（分页、搜索、筛选、排序） |

**请求参数**:
```typescript
{
  appId: string;  // 应用 ID
  search?: string;  // 搜索关键词（设备ID、邮箱）
  status?: "active" | "disabled" | "suspended" | "pending_verification";  // 状态筛选
  emailVerified?: boolean;  // 邮箱验证状态筛选
  subscriptionTier?: "free" | "pro_monthly" | "pro_yearly";  // 订阅层级筛选
  sortBy?: "createdAt" | "lastLoginAt" | "email" | "deviceId";  // 排序字段
  sortOrder?: "asc" | "desc";  // 排序方向
  limit?: number;  // 分页大小（1-100，默认50）
  offset?: number;  // 分页偏移（默认0）
}
```

**响应**:
```typescript
{
  items: Array<{
    user: {
      id: string;
      deviceId: string;
      email: string | null;
      emailVerified: boolean;
      status: string;
      lastLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    subscription: {
      userId: string;
      tier: string;
      status: string;
      expiresAt: Date | null;
      planName: string | null;
    } | null;
    hasActiveSubscription: boolean;
  }>;
  total: number;    // 总记录数
  limit: number;    // 每页数量
  offset: number;   // 当前偏移
  hasMore: boolean; // 是否有更多数据
}
```

#### `userManage.detail` - 获取用户详情
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/userManage.detail` |
| **功能** | 获取用户详情（包含完整信息、订阅历史、使用统计） |

**请求参数**:
```typescript
{
  userId: string;  // 用户 ID
}
```

**响应**:
```typescript
{
  user: {
    id: string;
    deviceId: string;
    email: string | null;
    status: string;
    emailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // 隐藏敏感信息：passwordHash, verificationToken 等
  };
  app: {
    id: string;
    name: string;
    bundleId: string;
  };
  activeSubscription: {
    subscription: Subscription;
    plan: {
      id: string;
      name: string;
      productId: string;
      priceCents: number;
      currency: string;
    };
  } | null;
  subscriptionHistory: Array<{
    subscription: Subscription;
    plan: {
      id: string;
      name: string;
      productId: string;
      priceCents: number;
      currency: string;
    };
  }>;
  usageStats: {
    recent30Days: Array<{
      date: Date;
      totalReplies: number;
      totalTokens: number;
      successfulCalls: number;
      failedCalls: number;
    }>;
    summary: {
      totalReplies: number;
      totalTokens: number;
      totalCalls: number;
      successRate: string;  // 百分比，如 "95.5"
    };
  };
  providerStats: Array<{
    aiProvider: string | null;
    model: string | null;
    callCount: number;
    totalTokens: number;
    avgDuration: number;
    successRate: number;
  }>;
}
```

#### `userManage.disable` - 禁用用户账户
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/userManage.disable` |
| **功能** | 禁用用户账户 |

**请求参数**:
```typescript
{
  userId: string;   // 用户 ID
  reason?: string;  // 禁用原因（可选）
}
```

**响应**:
```typescript
{
  user: User;      // 更新后的用户信息
  message: string; // 操作结果消息
}
```

#### `userManage.enable` - 启用用户账户
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/userManage.enable` |
| **功能** | 启用用户账户 |

**请求参数**:
```typescript
{
  userId: string;   // 用户 ID
  reason?: string;  // 启用原因（可选）
}
```

#### `userManage.suspend` - 暂停用户（临时限制）
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/userManage.suspend` |
| **功能** | 暂停用户（临时限制） |

**请求参数**:
```typescript
{
  userId: string;      // 用户 ID
  reason: string;      // 暂停原因（必需）
  durationDays?: number;  // 暂停时长（天，可选）
}
```

**响应**:
```typescript
{
  user: User;      // 更新后的用户信息
  message: string; // 操作结果消息（包含预计恢复时间）
}
```

#### `userManage.resetPassword` - 重置用户密码
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/userManage.resetPassword` |
| **功能** | 重置用户密码（可指定新密码或生成随机密码） |

**请求参数**:
```typescript
{
  userId: string;          // 用户 ID
  newPassword?: string;    // 新密码（可选，不提供则生成随机密码）
  forceChange?: boolean;   // 是否要求用户下次登录时修改密码（默认 true）
}
```

**响应**:
```typescript
{
  success: boolean;           // 操作是否成功
  message: string;            // 操作结果消息
  generatedPassword?: string; // 生成的随机密码（仅开发环境返回）
  forceChange: boolean;       // 是否要求用户下次登录时修改密码
}
```

#### `userManage.verifyEmailManually` - 手动验证用户邮箱
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/userManage.verifyEmailManually` |
| **功能** | 手动验证用户邮箱（跳过邮件验证流程） |

**请求参数**:
```typescript
{
  userId: string;  // 用户 ID
}
```

**响应**:
```typescript
{
  user: User;      // 更新后的用户信息
  message: string; // 操作结果消息
}
```

#### `userManage.delete` - 删除用户
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/userManage.delete` |
| **功能** | 删除用户（支持软删除和硬删除） |

**请求参数**:
```typescript
{
  userId: string;      // 用户 ID
  hardDelete?: boolean;  // 是否硬删除（永久删除，默认 false）
  reason?: string;      // 删除原因（可选）
}
```

**响应**（软删除）:
```typescript
{
  user: User;      // 更新后的用户信息（标记为禁用并清除敏感信息）
  message: string; // 操作结果消息
}
```

**响应**（硬删除）:
```typescript
{
  success: boolean;  // 操作是否成功
  message: string;   // 操作结果消息
}
```

---

### 10. 数据分析 (`analytics.*`)

提供应用级别的数据分析和业务洞察。

#### `analytics.usage` - 使用量统计分析
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/analytics.usage` |
| **功能** | 使用量统计分析（时间趋势、分布、热门风格） |

**请求参数**:
```typescript
{
  appId: string;  // 应用 ID
  startDate: string;  // 开始日期（YYYY-MM-DD）
  endDate: string;    // 结束日期（YYYY-MM-DD）
  granularity?: "day" | "week" | "month";  // 时间粒度（默认 "day"）
  groupByTier?: boolean;    // 是否按用户层级分组（默认 false）
  groupByProvider?: boolean;  // 是否按AI提供商分组（默认 false）
}
```

**响应**:
```typescript
{
  timeSeries: Array<{
    timePeriod: string;    // 时间区间
    totalReplies: number;  // 总回复数
    totalTokens: number;   // 总token数
    successfulCalls: number;  // 成功调用数
    failedCalls: number;      // 失败调用数
    uniqueUsers: number;      // 独立用户数
    successRate: number;      // 成功率（百分比）
  }>;
  summary: {
    totalUsers: number;       // 总用户数
    activeUsers: number;      // 活跃用户数
    totalReplies: number;     // 总回复数
    totalTokens: number;      // 总token数
    avgTokensPerReply: number; // 平均每回复token数
    successRate: number;      // 总成功率（百分比）
  };
  distribution: {
    byTier: Record<string, {  // 按订阅层级分布
      totalReplies: number;
      totalTokens: number;
      userCount: number;
    }>;
    byProvider: Record<string, {  // 按AI提供商分布
      callCount: number;
      totalTokens: number;
      avgDuration: number;
      successRate: number;
    }>;
    popularStyles: Array<{  // 热门风格分析
      styleId: string;
      styleName: string;
      usageCount: number;
    }>;
  };
}
```

#### `analytics.revenue` - 收入与订阅分析
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/analytics.revenue` |
| **功能** | 收入与订阅分析（MRR、ARR、转化漏斗等） |

**请求参数**:
```typescript
{
  appId: string;      // 应用 ID
  startDate: string;  // 开始日期（YYYY-MM-DD）
  endDate: string;    // 结束日期（YYYY-MM-DD）
  currency?: string;  // 货币代码（默认 "CNY"）
}
```

**响应**:
```typescript
{
  mrr: number;        // 月度经常性收入
  arr: number;        // 年度经常性收入
  totalRevenue: number;  // 总收入
  subscriptionStats: {
    total: number;    // 总订阅数
    active: number;   // 活跃订阅数
    cancelled: number; // 已取消订阅数
    expired: number;   // 已过期订阅数
  };
  conversionFunnel: {
    totalUsers: number;     // 总用户数
    freeUsers: number;      // 免费用户数
    proUsers: number;       // Pro用户数
    conversionRate: number; // 总转化率（百分比）
    freeToProConversion: number; // 免费转Pro转化率（百分比）
  };
  planPerformance: Array<{
    planId: string;        // 计划ID
    planName: string;      // 计划名称
    billingPeriod: string; // 计费周期
    price: number;         // 价格（元）
    currency: string;      // 货币
    activeSubscriptions: number;  // 活跃订阅数
    monthlyRevenue: number;       // 月收入
    features: string[];    // 功能列表
  }>;
  revenueTrend: Array<{
    month: string;         // 月份
    revenue: number;       // 收入
    newSubscriptions: number;  // 新订阅数
  }>;
  currency: string;        // 货币代码
}
```

#### `analytics.growth` - 用户增长与留存分析
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/analytics.growth` |
| **功能** | 用户增长与留存分析（同期群分析） |

**请求参数**:
```typescript
{
  appId: string;            // 应用 ID
  periods?: number;         // 分析周期数（默认为12个月）
  periodType?: "month" | "week";  // 周期类型（默认 "month"）
}
```

**响应**:
```typescript
{
  userGrowth: Array<{
    period: string;       // 时间区间
    newUsers: number;     // 新用户数
    activeUsers: number;  // 活跃用户数
    growthRate: number;   // 增长率
  }>;
  retention: {
    day1: number;   // 1日留存率（百分比）
    day7: number;   // 7日留存率（百分比）
    day30: number;  // 30日留存率（百分比）
  };
  cohortAnalysis: Array<{
    cohortPeriod: string;           // 同期群标识（如 "2026-01"）
    totalUsers: number;             // 同期群总用户数
    retention: Record<string, number>;  // 各周期留存率（period_0, period_1, ...）
  }>;
  activityLevels: {
    daily: number;    // 日活跃用户数
    weekly: number;   // 周活跃用户数
    monthly: number;  // 月活跃用户数
    inactive: number; // 不活跃用户数（>30天）
  };
  summary: {
    totalUsers: number;      // 总用户数
    activeUsers: number;     // 活跃用户数（月）
    inactiveUsers: number;   // 不活跃用户数
    activationRate: number;  // 激活率（百分比）
  };
}
```

#### `analytics.snapshot` - 实时数据快照
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/analytics.snapshot` |
| **功能** | 获取实时数据快照（仪表盘用） |

**请求参数**:
```typescript
{
  appId: string;  // 应用 ID
}
```

**响应**:
```typescript
{
  timestamp: string;  // 时间戳
  metrics: {
    totalUsers: number;          // 总用户数
    todayActiveUsers: number;    // 今日活跃用户
    activeSubscriptions: number; // 活跃订阅数
    revenueToday: number;        // 今日收入
    todayUsage: {
      totalReplies: number;      // 今日总回复数
      totalTokens: number;       // 今日总token数
      successRate: number;       // 今日成功率（百分比）
    };
  };
  health: {
    database: boolean;      // 数据库健康状态
    aiServices: boolean;    // AI服务健康状态
    rateLimiting: boolean;  // 速率限制状态
  };
}
```

---

### 11. 系统配置 (`settings.*`)

管理系统全局配置和应用级别配置。

#### `settings.global` - 获取全局配置
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/settings.global` |
| **功能** | 获取全局配置（邮件、AI、功能开关、安全、内容策略） |

**响应**:
```typescript
{
  settings: {
    email?: {              // 邮件服务配置
      enabled: boolean;
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      fromAddress: string;
      templates: Record<string, { subject: string; body: string }>;
    };
    aiDefaults?: {         // AI服务默认配置
      defaultProvider: string;
      fallbackProvider: string;
      maxRetries: number;
      timeoutMs: number;
      rateLimit: {
        requestsPerMinute: number;
        tokensPerMinute: number;
      };
    };
    features?: {           // 平台功能开关
      enableUserRegistration: boolean;
      enableEmailVerification: boolean;
      enablePasswordReset: boolean;
      enableSocialLogin: boolean;
      enableTwoFactorAuth: boolean;
      enableUsageAnalytics: boolean;
      enableAutoScaling: boolean;
    };
    security?: {           // 安全配置
      passwordMinLength: number;
      passwordRequireSpecialChar: boolean;
      sessionTimeoutMinutes: number;
      maxLoginAttempts: number;
      enableIpWhitelist: boolean;
      ipWhitelist: string[];
    };
    contentPolicy?: {      // 内容策略
      allowedLanguages: string[];
      profanityFilter: boolean;
      maxStyleNameLength: number;
      maxPromptLength: number;
      sensitiveTopics: string[];
    };
  };
  appId: string;      // 当前用作全局配置的应用ID
  appName: string;    // 应用名称
  message: string;    // 提示信息
}
```

#### `settings.updateGlobal` - 更新全局配置
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/settings.updateGlobal` |
| **功能** | 更新全局配置 |

**请求参数**: 同 `settings.global` 响应中的 `settings` 对象结构，所有字段可选。

**响应**:
```typescript
{
  settings: AppSettings;  // 更新后的配置
  message: string;        // 操作结果消息
}
```

#### `settings.app` - 获取应用配置
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/settings.app` |
| **功能** | 获取应用配置 |

**请求参数**:
```typescript
{
  appId: string;  // 应用 ID
}
```

**响应**:
```typescript
{
  appId: string;      // 应用ID
  appName: string;    // 应用名称
  settings: AppSettings;  // 应用配置
  platform: string;   // 平台类型
  isActive: boolean;  // 是否激活
  createdAt: Date;    // 创建时间
  updatedAt: Date;    // 更新时间
}
```

#### `settings.updateApp` - 更新应用配置
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/settings.updateApp` |
| **功能** | 更新应用配置 |

**请求参数**:
```typescript
{
  appId: string;  // 应用 ID
  // 基础配置（全部可选）
  freeReplyLimitPerDay?: number;      // 免费用户每日回复上限
  freeCandidateCount?: number;        // 免费用户候选回复数
  proCandidateCount?: number;         // Pro用户候选回复数
  enableAI?: boolean;                 // 是否启用AI功能
  enableSubscription?: boolean;       // 是否启用订阅功能
  // AI提供商配置
  aiProviders?: Array<{
    type: "openai" | "anthropic" | "google" | "mock" | "azure_openai" | "unknown";
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enabled: boolean;
    priority: number;
    retryCount?: number;
    timeout?: number;
  }>;
  defaultAIProvider?: string;         // 默认AI提供商
  // 自定义功能开关
  customFeatures?: Record<string, unknown>;  // 应用自定义功能配置
}
```

**响应**:
```typescript
{
  appId: string;      // 应用ID
  appName: string;    // 应用名称
  settings: AppSettings;  // 更新后的配置
  message: string;    // 操作结果消息
}
```

#### `settings.validateApp` - 验证应用配置
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/settings.validateApp` |
| **功能** | 验证应用配置的完整性和有效性 |

**请求参数**:
```typescript
{
  appId: string;  // 应用 ID
}
```

**响应**:
```typescript
{
  appId: string;    // 应用ID
  appName: string;  // 应用名称
  isValid: boolean; // 配置是否有效（无error级别问题）
  issues: Array<{
    level: "error" | "warning" | "info";
    field: string;
    message: string;
    suggestion?: string;
  }>;
  summary: {
    total: number;    // 总问题数
    errors: number;   // error级别问题数
    warnings: number; // warning级别问题数
    info: number;     // info级别问题数
  };
}
```

#### `settings.resetApp` - 重置应用配置
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | POST |
| **路径** | `/trpc/settings.resetApp` |
| **功能** | 重置应用配置到默认值 |

**请求参数**:
```typescript
{
  appId: string;   // 应用 ID
  confirm: boolean; // 确认重置操作（必须为 true）
}
```

**响应**:
```typescript
{
  appId: string;      // 应用ID
  appName: string;    // 应用名称
  settings: AppSettings;  // 重置后的默认配置
  message: string;    // 操作结果消息
}
```

#### `settings.listApps` - 获取所有应用的配置摘要
| 属性 | 值 |
|------|-----|
| **认证** | adminProcedure |
| **方法** | GET |
| **路径** | `/trpc/settings.listApps` |
| **功能** | 获取所有应用的配置摘要 |

**响应**:
```typescript
Array<{
  id: string;          // 应用ID
  name: string;        // 应用名称
  platform: string;    // 平台类型
  isActive: boolean;   // 是否激活
  configStatus: "configured" | "default";  // 配置状态
  userCount: number;   // 用户数
  subscriptionCount: number;  // 订阅数
  features: {
    aiEnabled: boolean;              // 是否启用AI功能
    subscriptionEnabled: boolean;    // 是否启用订阅功能
    hasCustomAIProviders: boolean;   // 是否有自定义AI提供商
  };
}>
```

---

## 🚀 快速开始

### 1. 服务启动
```bash
cd server
pnpm install
pnpm dev
```

服务启动后访问：`http://localhost:3000/health`

### 2. 初始化系统
```bash
curl -X POST http://localhost:3000/trpc/admin.init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 3. 创建第一个应用
使用创建的管理员账号登录后，创建应用：
```bash
curl -X POST http://localhost:3000/trpc/app.create \
  -H "Authorization: Bearer <管理员token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Keyboard",
    "bundleId": "com.example.aikeyboard",
    "platform": "ios",
    "description": "智能风格化回复键盘"
  }'
```

### 4. 客户端设备注册
客户端首次启动时调用：
```bash
curl -X POST http://localhost:3000/trpc/user.register \
  -H "x-api-key: <应用的api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_123456"
  }'
```

### 5. 生成 AI 回复
用户认证后调用 AI 服务：
```bash
curl -X POST http://localhost:3000/trpc/ai.generate \
  -H "x-api-key: <应用的api-key>" \
  -H "x-device-id: device_123456" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，今天天气不错",
    "stylePrompt": "用友好的语气回复"
  }'
```

---

## 📝 错误处理

### 常见错误码
| 状态码 | 错误类型 | 说明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 认证失败 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 422 | UNPROCESSABLE_CONTENT | 参数验证失败 |
| 429 | TOO_MANY_REQUESTS | 请求过于频繁 |
| 500 | INTERNAL_SERVER_ERROR | 服务器内部错误 |

### 错误响应格式
```typescript
{
  error: {
    message: string;      // 错误描述
    code: string;         // 错误码（如 "NOT_FOUND"）
    httpStatus: number;   // HTTP 状态码
    // 可能包含其他字段...
  }
}
```

---

## 🔗 相关资源

### 项目结构
```
server/
├── src/
│   ├── index.ts              # 服务入口
│   ├── trpc/                 # tRPC 配置
│   │   ├── index.ts          # 中间件定义
│   │   ├── context.ts        # 上下文创建
│   │   └── router.ts         # 根路由定义
│   ├── routers/              # 所有路由模块
│   │   ├── admin.ts          # 管理员路由
│   │   ├── app.ts            # 应用管理
│   │   ├── user.ts           # 用户管理
│   │   ├── ai.ts             # AI 功能
│   │   ├── style.ts          # 风格管理
│   │   ├── subscription-manage.ts # 订阅管理（后台）
│   │   ├── subscription.ts   # 订阅功能（客户端）
│   │   ├── user-manage.ts    # 用户管理（后台）
│   │   ├── analytics.ts      # 数据分析
│   │   └── settings.ts       # 系统配置
│   ├── db/                   # 数据库相关
│   │   ├── schema.ts         # 数据模型定义
│   │   └── index.ts          # 数据库连接
│   ├── services/             # 业务服务
│   └── utils/                # 工具类
└── API_DOCUMENTATION.md      # 本文档
```

### 环境变量配置
```bash
# .env 文件示例
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your_jwt_secret_key_here
# 邮件服务（可选）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@example.com
```

### 数据库迁移
```bash
# 修改 schema.ts 后
pnpm db:generate    # 生成迁移文件
pnpm db:migrate     # 执行迁移
pnpm db:studio      # 打开数据库管理界面
```

---

## 📞 技术支持

### 调试建议
1. 首先检查服务是否运行：`curl http://localhost:3000/health`
2. 确认认证头正确设置
3. 查看服务日志获取详细错误信息
4. 使用 `pnpm db:studio` 检查数据库状态

### 常见问题
**Q: 如何获取应用的 API Key？**
A: 通过管理后台创建应用后，系统会生成唯一的 `apiKey` 和 `apiSecret`，`apiKey` 提供给客户端使用。

**Q: 用户认证有哪几种方式？**
A: 支持两种方式：1) 传统方式：`x-api-key` + `x-device-id`；2) JWT 方式：`x-api-key` + `Authorization: Bearer <token>`。

**Q: 如何限制用户的 AI 使用量？**
A: 在应用的 `settings` 中配置 `usageLimit`，系统会自动统计每日用量并限制超量使用。

**Q: 订阅系统支持哪些支付平台？**
A: 目前设计支持 App Store 和 Google Play 的应用内购买，通过收据验证机制。

**Q: 如何添加新的 AI 提供商？**
A: 在 `src/services/ai/providers/` 目录下创建新的提供商类，实现 `BaseAIProvider` 接口，然后在 App 配置中启用。

---

## 📅 文档版本

| 版本 | 日期 | 更新说明 |
|------|------|----------|
| 1.0.0 | 2026-02-13 | 初始版本，包含全部 45 个接口 |
| 1.1.0 | 2026-02-14 | 新增用户管理、数据分析、系统配置模块，扩展至 83 个接口 |

**最后更新**: 2026-02-14
**维护者**: 后端开发团队