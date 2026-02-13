# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个多应用管理平台，采用 monorepo 结构：
- **server/** - Node.js 后端服务，为多个 iOS 应用提供统一的管理后台和 API
- **app/ai_keyboard/** - iOS 客户端应用（AI Keyboard），包含主应用和键盘扩展
- **admin/** - React 管理后台，用于管理平台和各个应用

当前主要应用为 AI Keyboard：一款智能风格化回复键盘，用户预设说话风格后，键盘自动读取剪贴板内容并生成个性化回复。admin 管理后台用于管理平台上的所有应用、用户、订阅和数据分析。

## 开发环境设置

### 后端环境
1. **Node.js 20+** 和 **pnpm**（包管理器）
2. **PostgreSQL 15+** 数据库
3. 复制环境变量模板：
   ```bash
   cd server
   cp .env.example .env  # 若无模板，参考现有 .env 结构
   ```
   必需变量：`DATABASE_URL`（PostgreSQL 连接字符串）、`PORT`、`HOST`、`JWT_SECRET`

### iOS 前端环境
1. **Xcode 15.0+** 和 **iOS 16.0+** SDK
2. 有效的 Apple 开发者账号（用于键盘扩展签名）

### Admin 前端环境
1. **Node.js 20+** 和 **npm**（包管理器）
2. 现代浏览器（Chrome、Firefox、Safari 最新版）

## 常用命令

### 后端开发
```bash
cd server

# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start

# 数据库迁移
pnpm db:generate    # 根据 schema.ts 生成迁移文件
pnpm db:migrate     # 执行迁移
pnpm db:push        # 直接推送 schema 到数据库（开发用）
pnpm db:studio      # 打开 Drizzle Studio 数据库管理界面
```

### iOS 前端开发
```bash
cd app/ai_keyboard

# 使用 Xcode 打开项目
open AIKeyboard.xcodeproj

# 或使用 xcodebuild 命令行构建
xcodebuild -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 15'

# 运行单元测试
xcodebuild test -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Admin 前端开发
```bash
cd admin

# 安装依赖
npm install

# 开发模式（热重载，端口 3100）
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

## 架构概述

### 后端架构（server/）
- **Web 框架**: Fastify + tRPC（类型安全的 RPC 框架）
- **数据库 ORM**: Drizzle ORM（PostgreSQL）
- **认证层级**:
  - `publicProcedure` - 无需认证
  - `appProcedure` - 需要有效的 `x-api-key`（App 级别）
  - `protectedProcedure` - 需要 `x-api-key` + `x-device-id`（用户级别）
  - `adminProcedure` - 管理员认证（简易 Token 方案，可升级为 JWT）
- **多租户设计**: 支持多个独立应用（App）的数据隔离，每个 App 有自己的 API Key 和配置
- **核心数据模型**:
  - `admins` - 管理员账户
  - `apps` - 应用注册表（多 App 管理）
  - `subscriptionPlans` - 订阅计划（每个 App 可自定义）
  - `users` - 用户（按 App 隔离）
  - `subscriptions` - 用户订阅状态
  - `styles` - 说话风格配置
  - `usageRecords` - 使用量统计

### 前端架构（app/ai_keyboard/）
- **开发语言**: Swift 5.9+
- **UI 框架**: SwiftUI（主应用）+ UIKit（键盘扩展）
- **最低版本**: iOS 16.0+
- **应用内购买**: StoreKit 2
- **项目结构**:
  - `AIKeyboard/` - 主应用（Host App）
  - `KeyboardExtension/` - 键盘扩展
  - `Shared/` - 主应用与扩展共享代码
  - `Tests/` - 单元测试
- **数据共享**: App Group Container（主应用与键盘扩展之间）
- **架构模式**: MVVM

### Admin 前端架构（admin/）
- **开发栈**: React 19 + TypeScript + Vite
- **UI 框架**: Ant Design 6 + Tailwind CSS
- **状态管理**: Zustand（本地状态） + React Query（服务端状态）
- **API 通信**: tRPC（类型安全的 RPC，通过 `/api/trpc` 代理到后端）
- **路由**: React Router DOM v7（支持嵌套路由和路由守卫）
- **认证**: JWT Token + localStorage 持久化
- **多租户支持**: 应用切换器（AppSwitcher），支持管理员管理多个应用
- **项目结构**:
  - `src/pages/` - 页面组件（Dashboard、Users、Subscriptions 等）
  - `src/components/` - 可复用 UI 组件
  - `src/layouts/` - 布局组件（AdminLayout）
  - `src/stores/` - Zustand 状态存储（authStore、appStore）
  - `src/utils/` - 工具函数和配置
  - `src/types/` - TypeScript 类型定义
  - `src/hooks/` - 自定义 React Hooks
- **关键特性**:
  - 路由守卫：未登录用户重定向到登录页
  - 错误处理：统一的 tRPC 错误处理中间件
  - 响应式布局：可折叠侧边栏
  - 应用隔离：通过 `x-app-id` 头区分不同应用数据

### 路由结构（tRPC）
```
admin.*               - 管理员认证与管理（管理后台）
app.*                 - 应用 CRUD 管理
subscriptionManage.*  - 订阅计划与用户订阅管理
user.*                - 用户注册与认证（客户端 API）
ai.*                  - AI 回复生成
style.*               - 说话风格管理
subscription.*        - 订阅查询与验证
```

## 关键文件

### 后端
- `server/src/index.ts` - 服务入口，Fastify 服务器配置
- `server/src/trpc/router.ts` - tRPC 根路由定义
- `server/src/trpc/index.ts` - tRPC 中间件和 procedure 定义
- `server/src/db/schema.ts` - 数据库 schema 定义（Drizzle ORM）
- `server/src/routers/` - 各业务模块的路由器
- `server/drizzle.config.ts` - Drizzle Kit 配置
- `server/.env` - 环境变量（不提交到版本控制）

### iOS 前端
- `app/ai_keyboard/project.yml` - Xcode 项目配置（XcodeGen）
- `app/ai_keyboard/AIKeyboard.xcodeproj` - Xcode 项目文件
- `app/ai_keyboard/Tests/AIKeyboardTests.swift` - 单元测试示例

### Admin 前端
- `admin/package.json` - 项目依赖和脚本
- `admin/vite.config.ts` - Vite 配置（代理、别名、端口 3100）
- `admin/src/App.tsx` - 应用根组件和路由配置
- `admin/src/main.tsx` - 应用入口（tRPC 和 React Query 提供者）
- `admin/src/utils/trpc.ts` - tRPC 客户端配置和错误处理
- `admin/src/types/router.ts` - tRPC 路由类型（从服务端导入）
- `admin/src/layouts/AdminLayout.tsx` - 主布局（侧边栏、顶部栏）
- `admin/src/stores/authStore.ts` - 认证状态管理（Zustand）
- `admin/src/stores/appStore.ts` - 应用状态管理
- `admin/eslint.config.js` - ESLint 配置

## 测试

### iOS 前端测试
- 单元测试位于 `app/ai_keyboard/Tests/AIKeyboardTests.swift`
- 测试内容：说话风格、风格组合、订阅状态、字符串和颜色扩展等
- 运行方式：Xcode 中按 `Cmd+U` 或使用 `xcodebuild test` 命令

### Admin 前端测试
- 目前未配置自动化测试框架
- 可通过 ESLint 进行代码规范检查：`npm run lint`

### 后端测试
- 目前未配置自动化测试框架
- 可通过 `curl` 或 tRPC 客户端测试 API

## 部署说明

### 后端部署
1. 构建生产版本：`pnpm build`
2. 启动服务：`pnpm start`
3. 需要 PostgreSQL 数据库连接
4. 建议使用进程管理器（如 PM2）或容器化部署

### iOS 前端部署
1. 使用 Xcode Archive 功能打包
2. 通过 App Store Connect 提交审核
3. 键盘扩展需要特殊权限配置

### Admin 前端部署
1. 构建生产版本：`npm run build`
2. 静态文件部署到 Web 服务器（如 Nginx、Apache、CDN）
3. 确保配置正确的 API 代理（将 `/api/trpc` 代理到后端服务）
4. 生产环境需要配置环境变量（如 API 地址）

## 注意事项

1. **数据库迁移**：修改 `schema.ts` 后必须运行 `pnpm db:generate` 和 `pnpm db:migrate`
2. **API 密钥**：每个客户端 App 需要在 `apps` 表中注册，获取唯一的 `apiKey` 和 `apiSecret`
3. **环境隔离**：开发、测试、生产环境使用不同的数据库和 `.env` 配置
4. **键盘扩展权限**：需要启用 "Allow Full Access" 才能读取剪贴板
5. **多 App 支持**：系统设计支持管理多个独立应用，当前主要为 AI Keyboard 服务
6. **Admin 开发代理**：开发模式下，Vite 将 `/api/trpc` 代理到 `http://localhost:3000`，确保后端服务运行在 3000 端口
7. **Admin 认证**：管理员登录后 JWT Token 存储在 localStorage，通过 Authorization 头发送
8. **Admin 应用切换**：管理员可通过 AppSwitcher 切换当前管理的应用，通过 `x-app-id` 头区分数据
9. **Admin 构建**：生产构建生成静态文件在 `dist/` 目录，需要正确配置服务器代理

## 快速参考

### 创建新 App（管理后台）
1. 在 `apps` 表中插入新记录，生成 `apiKey` 和 `apiSecret`
2. 配置订阅计划（`subscriptionPlans` 表）
3. 客户端使用分配的 `apiKey` 调用 API

### 初始化管理员
```bash
# 通过 tRPC 调用 admin.init 过程
# 或直接向 /trpc/admin.init 发送 POST 请求
```

### 检查服务健康
```bash
curl http://localhost:3000/health
```