[根目录](../CLAUDE.md) > **server**

# server 模块文档

## 模块职责

Node.js 后端服务，为多个 iOS 应用提供统一的管理后台和 API。采用 Fastify + tRPC + Drizzle ORM + PostgreSQL 技术栈，支持多租户架构，每个独立应用（App）有独立的数据隔离和配置。

## 快速开始

### 环境要求
- **Node.js 20+** 和 **pnpm**（包管理器）
- **PostgreSQL 15+** 数据库
- 复制环境变量模板（如果不存在）：

```bash
# 基于现有 .env 创建模板（如果 .env.example 不存在）
cp .env .env.example
# 然后编辑 .env 文件配置数据库连接
```

### 必需环境变量
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your_jwt_secret_key_here
```

### 安装与启动
```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start

# 健康检查
curl http://localhost:3000/health
```

## 常用命令

### 开发与构建
```bash
pnpm dev          # 开发服务器（热重载）
pnpm build        # TypeScript 编译到 dist/
pnpm start        # 运行生产构建
```

### 数据库操作
```bash
pnpm db:generate  # 根据 schema.ts 生成迁移文件
pnpm db:migrate   # 执行迁移到数据库
pnpm db:push      # 直接推送 schema 到数据库（开发用）
pnpm db:studio    # 打开 Drizzle Studio 数据库管理界面
```

### 服务检查
```bash
# 检查服务健康状态
curl http://localhost:3000/health

# 检查 tRPC 路由（需要具体端点）
curl http://localhost:3000/trpc/health
```

## 架构总览

### 技术栈
- **Web 框架**: Fastify（高性能 HTTP 服务器）
- **API 框架**: tRPC（类型安全的 RPC 框架）
- **数据库 ORM**: Drizzle ORM（PostgreSQL）
- **验证**: Zod（运行时类型验证）
- **认证**: JWT（JSON Web Tokens）

### 多租户架构图

```mermaid
graph TD
    A[客户端请求] --> B{认证检查}
    B -->|x-api-key| C[App 级别认证]
    B -->|x-api-key + x-device-id| D[用户级别认证]
    B -->|Bearer Token| E[管理员认证]

    C --> F[appProcedure]
    D --> G[protectedProcedure]
    E --> H[adminProcedure]

    F --> I[应用隔离数据]
    G --> J[用户隔离数据]
    H --> K[全局管理数据]

    I --> L[PostgreSQL<br/>多租户数据库]
    J --> L
    K --> L

    subgraph "数据隔离层"
        I
        J
        K
    end

    subgraph "认证层级"
        F
        G
        H
    end
```

### 核心架构概念

#### 1. 多租户设计
- 每个独立应用（App）在 `apps` 表中注册，获取唯一的 `apiKey` 和 `apiSecret`
- 所有业务数据（用户、订阅、风格等）按 `appId` 自动隔离
- 支持同时管理多个独立的客户端应用

#### 2. 认证层级
系统实现四级认证层级，从低到高：

1. **publicProcedure** - 无需任何认证
2. **appProcedure** - 需要有效的 `x-api-key`（App 级别）
3. **protectedProcedure** - 需要 `x-api-key` + `x-device-id` 或 JWT Token（用户级别）
4. **adminProcedure** - 需要管理员 JWT 认证（管理后台）

#### 3. 路由组织
tRPC 路由分为两大类别：

**管理后台路由**（需要管理员认证）：
- `admin.*` - 管理员认证与管理
- `app.*` - 应用 CRUD 管理
- `subscriptionManage.*` - 订阅计划与用户订阅管理

**客户端 API 路由**（需要 App 认证）：
- `user.*` - 用户注册与认证
- `ai.*` - AI 回复生成
- `style.*` - 说话风格管理
- `subscription.*` - 订阅查询与验证

## 详细架构

### 入口与启动流程

#### 主入口文件：`src/index.ts`
1. 检查邮件服务配置（可选）
2. 创建 Fastify 服务器实例，配置日志
3. 添加 CORS 中间件（支持跨域请求）
4. 注册 tRPC 插件（前缀 `/trpc`）
5. 添加健康检查端点 `/health`
6. 启动服务监听

#### 启动输出
服务启动后显示：
- 服务地址：`http://0.0.0.0:3000`
- tRPC 端点：`http://0.0.0.0:3000/trpc`
- 健康检查：`http://0.0.0.0:3000/health`

### tRPC 配置

#### 上下文创建：`src/trpc/context.ts`
为每个请求创建上下文，包含：
- 数据库连接 (`db`)
- 请求头信息 (`headers`)
- 解析出的 App 信息 (`app`，如果提供 `x-api-key`)
- 设备标识 (`deviceId`，如果提供 `x-device-id`)
- 认证令牌 (`authorization`)

#### 中间件定义：`src/trpc/index.ts`
定义四个层级的 procedure：
- `publicProcedure` - 基础 procedure，无认证
- `appProcedure` - 验证 `x-api-key`，设置 `ctx.app`
- `protectedProcedure` - 支持两种用户认证方式
- `adminProcedure` - 验证管理员 JWT 或简易令牌

#### 路由组织：`src/trpc/router.ts`
聚合所有子路由到根路由，定义完整的 API 结构。

### 数据模型

#### 核心表结构（`src/db/schema.ts`）
- **`admins`** - 管理员账户（全局）
- **`apps`** - 应用注册表（多 App 管理）
- **`subscriptionPlans`** - 订阅计划（每个 App 可自定义）
- **`users`** - 用户（按 `appId` 隔离）
- **`subscriptions`** - 用户订阅状态
- **`styles`** - 说话风格配置
- **`usageRecords`** - 使用量统计

#### 数据库操作
- Schema 定义：`src/db/schema.ts`
- 数据库连接：`src/db/index.ts`
- 迁移管理：Drizzle Kit（配置见 `drizzle.config.ts`）

### 服务层

#### AI 服务架构
```
src/services/ai/
├── service.ts          # AI 服务主类
├── types.ts            # AI 相关类型定义
└── providers/          # AI 提供商实现
    ├── base.ts         # 基础提供商接口
    ├── openai.ts       # OpenAI 提供商
    └── mock.ts         # 模拟提供商（测试用）
```

#### 工具类
- `src/utils/jwt.ts` - JWT 令牌生成与验证
- `src/utils/crypto.ts` - 加密工具（API 密钥生成等）
- `src/utils/email.ts` - 邮件服务工具（可选）

## 开发指南

### 添加新 API 端点

1. **创建路由文件**：在 `src/routers/` 目录下创建新的路由文件
2. **定义路由逻辑**：使用适当的 procedure（public/app/protected/admin）
3. **注册到根路由**：在 `src/trpc/router.ts` 中导入并添加到 `appRouter`
4. **添加输入验证**：使用 Zod 定义输入 schema

示例：
```typescript
// src/routers/example.ts
import { appProcedure } from "../trpc";
import { z } from "zod";

export const exampleRouter = router({
  hello: appProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello ${input.name}`;
    }),
});
```

### 修改数据库结构

1. **更新 Schema**：修改 `src/db/schema.ts` 文件
2. **生成迁移**：运行 `pnpm db:generate` 生成迁移文件
3. **执行迁移**：运行 `pnpm db:migrate` 应用到数据库
4. **开发快捷方式**：使用 `pnpm db:push` 直接推送变更（仅开发环境）

### 支持新的 AI 提供商

1. **创建提供商类**：在 `src/services/ai/providers/` 目录下创建新文件
2. **实现接口**：实现 `BaseAIProvider` 接口定义的方法
3. **集成到服务**：在 `AIService` 类中支持新提供商
4. **App 配置**：在 App 配置中启用对应的提供商

### 创建新的 App（多租户）

1. **注册新 App**：通过管理后台或直接向 `apps` 表插入记录
2. **生成密钥**：系统会自动生成唯一的 `apiKey` 和 `apiSecret`
3. **配置订阅计划**：在 `subscriptionPlans` 表中为该 App 创建计划
4. **客户端集成**：客户端使用分配的 `apiKey` 调用 API

## 配置文件说明

### `package.json` 脚本
- `dev` - 开发服务器，使用 tsx 进行热重载
- `build` - TypeScript 编译到 dist/ 目录
- `start` - 运行生产构建
- `db:*` - 数据库迁移和管理命令

### `tsconfig.json` 配置
- 目标：ES2022，模块：ESNext
- 严格模式启用，包含路径映射 `@/*` → `./src/*`
- 输出目录：`./dist`，源目录：`./src`

### `drizzle.config.ts`
  - 方言：PostgreSQL
  - Schema 路径：`./src/db/schema.ts`
  - 输出目录：`./drizzle`
  - 数据库凭证：从 `DATABASE_URL` 环境变量读取

### 环境变量（`.env`）
- `DATABASE_URL` - PostgreSQL 连接字符串（必需）
- `PORT` - 服务端口（默认 3000）
- `HOST` - 服务主机（默认 0.0.0.0）
- `JWT_SECRET` - JWT 签名密钥（必需）
- `EMAIL_*` - 邮件服务配置（可选）

## 测试与质量

### 当前状态
- 目前未配置自动化测试框架
- 可通过 `curl` 或 tRPC 客户端手动测试 API
- 建议添加 Jest 或 Vitest 进行单元测试

### 代码质量
- TypeScript 严格模式启用
- ESLint 配置（待添加）
- Prettier 配置（待添加）

## 常见问题 (FAQ)

### Q: 如何添加新的 API 端点？
A: 在 `src/routers/` 目录下创建新的路由文件，然后在 `src/trpc/router.ts` 中注册到根路由。

### Q: 如何修改数据库结构？
A: 更新 `src/db/schema.ts` 文件，然后运行 `pnpm db:generate` 生成迁移文件，最后运行 `pnpm db:migrate` 执行迁移。

### Q: 如何支持新的 AI 提供商？
A: 在 `src/services/ai/providers/` 目录下创建新的提供商类，实现 `BaseAIProvider` 接口，然后在 App 配置中启用。

### Q: 如何创建新的 App（多租户）？
A: 通过管理后台或直接向数据库 `apps` 表插入记录，生成唯一的 `apiKey` 和 `apiSecret`。

### Q: 用户认证有哪些方式？
A: 支持两种方式：1) `x-api-key` + `x-device-id`（传统方式）；2) `x-api-key` + JWT Token（推荐方式）。

### Q: 管理后台如何认证？
A: 支持两种 Token 格式：1) JWT Token（新）包含管理员信息和过期时间；2) 简易 Token（旧）`admin:<id>` 格式，向后兼容。

## 关键文件清单

### 核心文件
- `src/index.ts` - 服务入口，Fastify 服务器配置
- `src/trpc/router.ts` - tRPC 根路由定义
- `src/trpc/index.ts` - tRPC 中间件和 procedure 定义
- `src/trpc/context.ts` - tRPC 上下文创建

### 路由文件
- `src/routers/admin.ts` - 管理员路由
- `src/routers/app.ts` - 应用管理路由
- `src/routers/subscription-manage.ts` - 订阅管理路由
- `src/routers/user.ts` - 用户路由
- `src/routers/ai.ts` - AI 路由
- `src/routers/style.ts` - 风格路由
- `src/routers/subscription.ts` - 订阅查询路由

### 数据库文件
- `src/db/schema.ts` - 数据库 schema 定义
- `src/db/index.ts` - 数据库连接和客户端

### 服务文件
- `src/services/ai/service.ts` - AI 服务主类
- `src/services/ai/providers/` - AI 提供商实现
- `src/services/ai/types.ts` - AI 相关类型定义

### 工具文件
- `src/utils/jwt.ts` - JWT 工具
- `src/utils/crypto.ts` - 加密工具
- `src/utils/email.ts` - 邮件工具

### 配置文件
- `package.json` - 项目配置和脚本
- `tsconfig.json` - TypeScript 配置
- `drizzle.config.ts` - Drizzle Kit 配置
- `.env` - 环境变量（本地，不提交）

## AI助手协作指南

### 角色定位
- **资深后端开发者**：专注于本项目的后端开发工作
- **工作范围**：`~/Workspace/github/app-manager__server/server` 目录及所有后端相关代码
- **协作模式**：根据用户指令执行具体的后端开发任务，提供技术建议和解决方案

### 技术栈专注
- **核心框架**：Fastify + tRPC + Drizzle ORM + PostgreSQL
- **架构模式**：多租户设计、四级认证层级（public/app/protected/admin）
- **开发重点**：数据库操作、API路由设计、服务层实现、工具类开发

### 核心关注点
1. **数据库操作与迁移** - Drizzle ORM schema定义、迁移生成与执行
2. **API开发** - tRPC路由设计、输入验证、错误处理
3. **服务层开发** - AI服务集成、用户管理、订阅管理、说话风格管理
4. **工具类开发** - JWT认证、加密工具、邮件服务（可选）
5. **认证系统** - API密钥+设备ID和JWT双重认证支持

### 开发原则
- **工程最佳实践**：严格遵循KISS（简单至上）、YAGNI（精益求精）、DRY（杜绝重复）、SOLID原则
- **安全第一**：高风险操作前必须获得明确确认（文件删除、代码提交、系统配置等）
- **持续工作**：持续工作直到问题完全解决，基于事实而非猜测
- **先读后写**：充分理解现有代码再修改，每次操作前充分规划和反思

### 典型任务
- 添加新的API端点（遵循现有路由结构）
- 修改数据库schema并执行迁移
- 实现新的业务服务逻辑
- 集成新的AI服务提供商
- 优化现有代码性能和可维护性
- 调试和解决后端技术问题

### 使用提示
- 请提供清晰、具体的任务描述
- 涉及数据变更时，建议先备份或确认影响范围
- 需要数据库操作时，请确认已配置正确的环境变量
- 对于复杂任务，可请求分阶段执行或提供更多上下文信息

## 变更记录 (Changelog)

- **2026-02-13** - AI助手协作指南添加
  - 添加AI助手角色定位和技术栈专注说明
  - 明确后端开发工作范围和核心关注点
  - 记录开发原则和典型任务指南
  - 提供使用提示和协作规范

- **2026-02-13** - CLAUDE.md 优化
  - 重新组织文档结构，增强可读性
  - 添加快速开始和常用命令章节
  - 添加多租户架构图和详细架构说明
  - 完善开发指南和配置文件说明

- **2026-02-13 18:40:03** - AI 上下文初始化
  - 创建模块文档
  - 记录模块职责和接口
  - 添加常见问题和文件清单