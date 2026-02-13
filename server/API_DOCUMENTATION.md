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

- **总接口数**: 45 个（tRPC 接口 44 个 + 健康检查 1 个）
- **认证分布**: public(2) / app(11) / protected(13) / admin(18)
- **HTTP 方法**: GET(10) / POST(34)

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
│   │   └── subscription.ts   # 订阅功能（客户端）
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

**最后更新**: 2026-02-13
**维护者**: 后端开发团队