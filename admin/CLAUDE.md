# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the admin frontend of this repository.

## 项目概述

这是多应用管理平台的 React 管理后台，用于管理平台上的所有 iOS 应用、用户、订阅和数据分析。admin 是 monorepo 的一部分，与后端服务（server/）和 iOS 客户端（app/ai_keyboard/）协同工作。

**核心功能：**
- 多应用管理：管理员可以创建、配置和管理多个独立的 iOS 应用
- 用户管理：查看和管理每个应用的用户数据
- 订阅管理：管理用户订阅状态和订阅计划
- 数据分析：查看应用使用统计和图表
- 平台设置：配置平台级和应用级设置

## 变更记录

### 2026-02-13 - 项目状态更新
- **前端开发者角色确认**：专注 React 管理后台开发
- **项目结构验证**：确认所有核心文件存在且配置正确
- **技术栈版本记录**：详细记录依赖版本和配置
- **开发环境确认**：开发端口 3100，代理配置正常

## 项目状态验证

### ✅ 已验证内容
1. **项目配置完整性**
   - `package.json` 依赖版本正确，技术栈配置完整
   - `vite.config.ts` 代理设置正确，路径别名配置正常
   - TypeScript 配置完整，严格模式启用
   - 开发端口 3100 配置正确，代理到后端 3000 端口

2. **源代码结构完整性**
   - 7个主要页面文件全部存在且命名规范
   - 4个组件文件功能明确，结构清晰
   - 2个状态管理 Store 实现完整
   - 工具函数和类型定义齐全

3. **架构实现验证**
   - tRPC 客户端配置完整，错误处理机制健全
   - 多租户设计：AppSwitcher 组件 + `x-app-id` 请求头
   - 认证系统：JWT Token + 路由守卫 + localStorage 持久化
   - 状态管理：Zustand（客户端）+ React Query（服务端）

4. **开发环境就绪**
   - 依赖可通过 `npm install` 安装
   - 开发服务器可通过 `npm run dev` 启动
   - 构建命令 `npm run build` 可用
   - 代码规范检查 `npm run lint` 配置正确

### 📊 当前项目状态
- **代码质量**：TypeScript 严格模式，类型安全完整
- **架构设计**：遵循现代 React 最佳实践，关注点分离清晰
- **可维护性**：组件结构合理，状态管理规范
- **扩展性**：支持多应用管理，架构具备良好扩展性

## 开发环境设置

### 环境要求
1. **Node.js 20+** 和 **npm**（包管理器）
2. 现代浏览器（Chrome、Firefox、Safari 最新版）
3. **后端服务**：需要运行 server/ 服务（默认端口 3000）

### 安装依赖
```bash
npm install
```

### 配置详情

#### Vite 配置（vite.config.ts）
- **开发端口**：3100
- **代理设置**：`/api/trpc` → `http://localhost:3000`（后端服务）
- **路径别名**：`@/` → `src/`
- **插件**：React 插件 + Tailwind CSS 插件

#### TypeScript 配置
- **编译目标**：ES2022（应用），ES2023（Node）
- **模块解析**：bundler 模式
- **严格模式**：启用所有严格检查
- **路径别名**：`@/*` → `src/*`

#### 包管理器
- **包管理器**：npm（项目使用 npm scripts）
- **项目类型**：ES 模块（`"type": "module"`）

## 常用命令

### 开发模式
```bash
# 启动开发服务器（端口 3100，热重载）
npm run dev
```

### 构建与部署
```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码规范检查
npm run lint
```

### 开发工作流
1. 确保后端服务运行：`cd server && pnpm dev`
2. 启动 admin 前端：`npm run dev`
3. 访问 http://localhost:3100 进行开发

## 架构概述

### 技术栈（详细版本）
- **前端框架**：React 19.2.0 + TypeScript 5.9.3
- **构建工具**：Vite 7.3.1（开发服务器和构建）
- **UI 组件库**：Ant Design 6.2.3 + Tailwind CSS 4.1.18
- **状态管理**：Zustand 5.0.11（本地状态）+ React Query 5.90.20（服务端状态）
- **API 通信**：tRPC 11.10.0（类型安全的 RPC）
- **路由**：React Router DOM 7.13.0
- **代码规范**：ESLint 9.39.1 + TypeScript 严格模式
- **图表库**：@ant-design/charts 2.6.7
- **图标库**：@ant-design/icons 6.1.0
- **日期处理**：dayjs 1.11.19

### 项目结构（已验证文件列表）

**核心目录结构：**
```
src/
├── pages/              # 7个主要页面组件（已全部验证存在）
│   ├── Dashboard.tsx      # 仪表盘页面 - 数据分析概览
│   ├── Users.tsx          # 用户管理页面 - 应用用户列表和管理
│   ├── Subscriptions.tsx  # 订阅管理页面 - 用户订阅状态管理
│   ├── Analytics.tsx      # 数据分析页面 - 图表和统计
│   ├── Settings.tsx       # 应用设置页面 - 配置管理
│   ├── Apps.tsx           # 应用管理页面 - 多应用 CRUD 管理
│   └── Login.tsx          # 登录页面 - 管理员认证入口
├── components/         # 4个可复用 UI 组件
│   ├── AppSwitcher.tsx    # 应用切换器组件 - 多租户应用选择
│   ├── PageHeader.tsx     # 页面头部组件 - 标题和操作按钮
│   ├── StatsCard.tsx      # 统计卡片组件 - 数据展示卡片
│   └── Loading.tsx        # 加载组件 - 加载状态指示器
├── layouts/            # 布局组件
│   └── AdminLayout.tsx    # 主布局组件 - 侧边栏导航 + 顶部栏
├── stores/             # Zustand 状态管理存储（2个Store）
│   ├── authStore.ts       # 认证状态管理 - JWT Token、用户信息
│   └── appStore.ts        # 应用状态管理 - 当前应用、应用列表
├── utils/              # 工具函数和配置
│   ├── trpc.ts           # tRPC 客户端配置 - API 通信核心
│   └── constants.ts      # 常量定义 - 应用常量配置
├── types/              # TypeScript 类型定义
│   ├── index.ts          # 通用类型定义
│   └── router.ts         # tRPC 路由类型（从后端 server/ 导入）
└── hooks/              # 自定义 React Hooks
    └── useLoading.ts     # 加载状态 Hook - 统一的加载状态管理
```

**配置文件：**
- `package.json` - 项目依赖和脚本配置（已验证技术栈版本）
- `vite.config.ts` - Vite 构建配置（代理、路径别名、端口）
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` - TypeScript 配置
- `CLAUDE.md` - 项目文档（本文件）

### 关键架构模式

#### 1. 路由与认证守卫
- **路由守卫**：`ProtectedRoute` 和 `GuestRoute` 组件保护路由
- **认证状态**：JWT Token 存储在 localStorage，通过 Zustand 管理
- **自动重定向**：未登录用户访问受保护路由 → 重定向到登录页

#### 2. tRPC 集成
- **类型安全**：从后端直接导入 `AppRouter` 类型，确保前后端类型一致
- **错误处理**：统一的错误处理中间件，显示用户友好的错误消息
- **请求头**：自动附加 Authorization Token 和当前 App ID（`x-app-id`）
- **代理配置**：开发模式下 Vite 将 `/api/trpc` 代理到 `http://localhost:3000`

#### 3. 多租户设计
- **应用切换器**：`AppSwitcher` 组件允许管理员切换当前管理的应用
- **数据隔离**：通过 `x-app-id` HTTP 头区分不同应用的数据
- **状态管理**：`appStore` 管理当前选中的应用和应用列表

#### 4. 状态管理策略
- **Zustand**：用于客户端状态（认证、应用选择、UI 状态）
- **React Query**：用于服务端状态（API 数据缓存、轮询、优化更新）
- **持久化**：Zustand 状态自动持久化到 localStorage

#### 5. 布局系统
- **响应式侧边栏**：可折叠的侧边栏导航
- **菜单组织**：
  - 当前应用菜单：仪表盘、用户、订阅、分析、设置
  - 全局管理菜单：应用管理
- **面包屑导航**：基于当前路由显示导航路径

## 关键文件说明

### 1. `src/App.tsx` - 应用根组件
- 定义所有路由和路由守卫
- 组织页面层次结构
- 处理认证状态重定向

### 2. `src/main.tsx` - 应用入口
- 初始化 tRPC 和 React Query 提供者
- 设置全局配置
- 挂载 React 应用

### 3. `src/utils/trpc.ts` - tRPC 客户端
- 配置 HTTP 批量请求链接
- 实现错误处理中间件
- 设置认证头和 App ID 头
- 定义错误消息映射

### 4. `src/layouts/AdminLayout.tsx` - 主布局
- 侧边栏导航菜单
- 顶部栏用户菜单
- 应用切换器集成
- 响应式布局逻辑

### 5. `src/stores/authStore.ts` - 认证状态
- 管理员用户信息管理
- JWT Token 存储和清理
- 登录/登出操作
- 持久化到 localStorage

### 6. `vite.config.ts` - 构建配置
- 开发服务器代理到后端（`/api/trpc` → `localhost:3000`）
- 路径别名配置（`@/` → `src/`）
- Tailwind CSS 集成
- 开发端口 3100

## 开发注意事项

### 1. API 集成
- 所有 API 调用通过 tRPC 客户端进行
- 使用 `trpc` 提供的 hooks（如 `trpc.admin.list.useQuery()`）
- 错误自动处理，无需手动 try-catch

### 2. 状态管理
- 服务端数据：使用 React Query（通过 tRPC hooks）
- 客户端状态：使用 Zustand stores
- 避免 prop drilling，使用适当的 context 或 store

### 3. 样式规范
- 基础样式：Ant Design 组件
- 自定义样式：Tailwind CSS 实用类
- 主题配置：通过 Ant Design 的 theme token

### 4. 类型安全
- tRPC 提供端到端类型安全
- 后端 schema 更改后，需要重启前后端服务以同步类型
- 使用 TypeScript 严格模式

### 5. 开发调试
- 开发工具：React DevTools, Redux DevTools（Zustand）
- 网络请求：浏览器开发者工具查看 tRPC 请求
- 控制台日志：检查错误和警告

## 与后端集成

### 认证流程
1. 管理员登录 → 后端返回 JWT Token
2. Token 存储在 localStorage 和 authStore
3. 后续请求自动附带 `Authorization: Bearer <token>` 头
4. Token 过期后需要重新登录

### 多应用支持
1. 管理员选择当前应用 → 设置 `x-app-id` 头
2. 后端根据 App ID 过滤数据
3. 应用切换实时生效，无需刷新页面

### API 路由结构
admin 前端对应后端 tRPC 路由：
- `admin.*` - 管理员认证与管理
- `app.*` - 应用 CRUD 管理
- `subscriptionManage.*` - 订阅计划管理
- 其他路由用于客户端 API

## 部署说明

### 生产构建
```bash
npm run build
```
生成静态文件到 `dist/` 目录。

### 服务器配置
1. Web 服务器（Nginx/Apache）托管 `dist/` 目录
2. 配置代理：将 `/api/trpc` 路径代理到后端服务
3. 配置 HTTPS 和域名

### 环境变量
生产环境可能需要配置：
- API 服务地址
- 其他环境特定配置

## 相关链接
- 仓库根目录 CLAUDE.md：整体项目架构和命令
- 后端服务（server/）：API 实现和数据库 schema
- iOS 客户端（app/ai_keyboard/）：移动端应用