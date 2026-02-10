# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [0.7.0] - 2026-02-10

### 新增
- **订阅计划表 `subscription_plans`**：
  - 每个 App 可独立配置多个订阅方案（名称、产品ID、价格、周期、功能列表等）
  - 支持 monthly / yearly / lifetime / custom 四种计费周期
  - 价格以"分"为单位存储，支持多币种
  - 功能列表（features JSONB）支持自定义展示内容
  - 同一 App 内 productId 唯一约束
  - 上架/下架状态 + 排序权重
- **数据库枚举 `billing_period`**：monthly / yearly / lifetime / custom
- **管理后台订阅管理路由 `subscriptionManage.*`**：
  - `createPlan` 创建订阅计划
  - `listPlans` 查询指定 App 的订阅计划列表（支持显示已下架）
  - `updatePlan` 更新计划（名称、价格、功能、上下架等）
  - `deletePlan` 删除计划（有活跃订阅时禁止删除，需先下架）
  - `listSubscriptions` 查询指定 App 的用户订阅列表（支持按状态/层级筛选、分页）
  - `activateSubscription` 手动激活用户订阅（用于补偿/促销场景）
  - `cancelSubscription` 手动取消用户订阅
  - `extendSubscription` 延长用户订阅（智能叠加剩余时间）
  - `stats` 订阅数据统计（按状态/层级分组计数、付费转化率）
- **客户端订阅路由增强**：
  - `subscription.plans` 新增：获取当前 App 可用的订阅计划列表（客户端付费墙展示）
  - `subscription.status` 增强：返回关联的计划详情（名称、周期）
  - `subscription.verify` 重构：自动通过 productId 匹配 App 下的订阅计划进行激活

### 变更
- `subscriptions` 表新增 `plan_id` 外键关联 `subscription_plans`（免费用户为 null）
- 客户端购买验证不再硬编码 tier 解析，改为通过 plan 配置动态获取

---

## [0.6.0] - 2026-02-10

### 重构
- **服务端架构升级为多 App 管理后台**，支持一套服务管理多个客户端应用
- 所有业务数据（用户、风格、订阅、用量）全部实现按 App 隔离

### 新增
- **数据库新增表**：
  - `admins` 管理员表（用户名、邮箱、密码哈希、角色：super_admin/admin）
  - `apps` 应用表（名称、BundleID、平台、API Key/Secret、自定义配置 JSONB、启停状态）
- **数据库枚举新增**：`admin_role`、`platform`
- **数据库改动**：
  - `users` 表新增 `app_id` 外键，联合唯一索引 `(app_id, device_id)` 替代原 `device_id` 唯一约束
  - `styles` 表新增 `app_id` 外键，内置风格按 App 区分
- **tRPC Procedure 四级权限体系**：
  - `publicProcedure` → 无需认证
  - `appProcedure` → 客户端 App 级别（需 `x-api-key`）
  - `protectedProcedure` → 客户端用户级别（需 `x-api-key` + `x-device-id`）
  - `adminProcedure` → 管理后台（需 `Authorization: Bearer <token>`）
- **管理后台路由 `admin.*`**：
  - `admin.init` 系统初始化（创建首个超级管理员）
  - `admin.login` 管理员登录
  - `admin.create` 创建管理员（仅 super_admin）
  - `admin.me` 当前管理员信息
- **应用管理路由 `app.*`**：
  - `app.create` 创建应用（自动生成 API Key/Secret）
  - `app.list` 应用列表
  - `app.detail` 应用详情（含用户统计）
  - `app.update` 更新应用信息与配置
  - `app.regenerateKey` 重新生成 API Key
  - `app.delete` 删除应用（仅 super_admin，级联删除关联数据）
- **工具模块 `utils/crypto.ts`**：密码哈希（scrypt）、API Key 生成（零外部依赖）
- **App 级别自定义配置（JSONB）**：每个 App 可独立配置免费额度、候选数、功能开关等

### 变更
- `tRPC Context` 重构：自动从 `x-api-key` 请求头解析当前 App 实例
- 所有客户端路由（user/ai/style/subscription）全部改为 App 作用域查询
- AI 路由的用量限制改为从 App settings 动态读取，不再硬编码
- CORS 请求头新增 `x-api-key` 支持

---

## [0.5.0] - 2026-02-10

### 新增
- **server/** 服务端基础架构搭建，技术栈：tRPC + Fastify + Drizzle ORM + PostgreSQL
- **数据库层 (Drizzle ORM)**：
  - `db/schema.ts` 完整数据库 Schema 定义（users / subscriptions / styles / usage_records 四张表）
  - `db/index.ts` postgres.js 驱动连接与 Drizzle 实例初始化
  - `drizzle.config.ts` Drizzle Kit 迁移配置
  - 自定义枚举类型：subscription_tier、subscription_status
- **tRPC 核心层**：
  - `trpc/index.ts` tRPC 初始化，含 publicProcedure / protectedProcedure 两级权限
  - `trpc/context.ts` 请求上下文（注入数据库实例、设备标识、授权信息）
  - `trpc/router.ts` 根路由聚合，整合四大业务模块
- **业务路由模块**：
  - `routers/user.ts` 用户路由（设备注册 / Token 刷新 / 用户信息查询）
  - `routers/ai.ts` AI 路由（回复生成 / 用量限制检查 / 模型列表）
  - `routers/style.ts` 风格路由（内置风格列表 / 用户自定义 CRUD）
  - `routers/subscription.ts` 订阅路由（收据验证 / 状态查询 / 恢复购买）
- **服务入口**：
  - `src/index.ts` Fastify 服务启动，集成 tRPC 插件、CORS 支持、健康检查端点
- **工程配置**：
  - `package.json` 项目依赖与脚本（dev / build / db:generate / db:migrate / db:push / db:studio）
  - `tsconfig.json` TypeScript 严格模式配置
  - `.env` 环境变量模板（数据库连接、JWT 密钥、AI 服务密钥）

---

## [0.4.0] - 2026-02-09

### 新增
- 生成完整 iOS App 项目至 `app/` 目录，使用 XcodeGen 构建 Xcode 工程
- **Shared/** 共享模块：
  - `AppConstants` 全局常量（App Group、免费/Pro 限制、UserDefaults Key 等）
  - `APIConfig` 服务端 API 地址配置（支持 DEBUG/RELEASE 环境切换）
  - `SpeakingStyle` 说话风格数据模型（含 6 种内置风格预设）
  - `StyleCombination` 风格组合模型（支持多风格权重混搭）
  - `Subscription` 订阅状态模型（SubscriptionTier / SubscriptionStatus）
  - `Color+Extension` / `String+Extension` / `UserDefaults+AppGroup` 扩展
- **AIKeyboard/** 主应用：
  - `AIKeyboardApp` SwiftUI App 入口
  - `ContentView` 主 Tab 页（风格 + 设置）
  - `StyleListView` 风格列表页（内置/自定义/组合管理，多选组合）
  - `StyleEditorView` 自定义风格编辑器（图标、颜色、Prompt、参数配置）
  - `SubscriptionView` 付费墙页面（功能对比 + 商品选择 + 试用/购买）
  - `SettingsView` 设置页（订阅状态卡片、键盘设置引导）
  - `AIService` AI 回复生成服务（调用服务端 API）
  - `ClipboardService` 剪贴板监听服务
  - `StyleManager` 风格管理服务（增删改查 + 持久化）
  - `SubscriptionManager` StoreKit 2 订阅管理（购买/恢复/状态同步/App Group）
  - `TokenManager` JWT Token 管理（Keychain 存储 + 设备注册）
- **KeyboardExtension/** 键盘扩展：
  - `KeyboardViewController` 键盘主控制器（UIKit + SwiftUI 混合）
  - `KeyboardMainView` 键盘 SwiftUI 主视图（剪贴板栏 + 回复区 + 工具栏）
  - `ReplyCardView` 回复候选卡片
  - `StyleSelectorView` 风格指示器
  - `KeyboardClipboardHelper` 剪贴板辅助工具
- **Tests/** 单元测试（风格、组合、订阅、字符串扩展、颜色扩展等）
- 资源文件：Info.plist、Entitlements（App Group）、Assets.xcassets
- `project.yml` XcodeGen 配置文件
- `app/.gitignore`

## [0.3.0] - 2026-02-09

### 变更
- 项目结构调整为 monorepo：客户端代码移至 `app/`，服务端代码置于 `server/`
- 技术栈拆分为客户端和服务端两部分独立展示
- 快速开始指南拆分为服务端启动、客户端运行、键盘启用三个步骤

### 新增
- 新增 `server/` 服务端完整目录结构（路由、服务、模型、中间件、工具类）
- 新增服务端技术栈：Node.js + TypeScript + Express/Hono + PostgreSQL + Redis + Docker
- 新增服务端 API 接口文档（订阅验证、状态查询、恢复购买、Webhook、AI 生成、用户注册）
- 新增服务端环境变量配置说明与 Docker 一键部署指南
- Phase 2 开发计划新增 7 项服务端任务（认证、收据验证、Webhook、AI 代理等）

## [0.2.0] - 2026-02-09

### 新增
- README 新增订阅会员体系功能介绍
- README 新增订阅方案对比表（免费版 / Pro 月度 / Pro 年度）
- 技术架构新增 SubscriptionView、Subscription 模型、SubscriptionManager 服务
- 技术栈新增 StoreKit 2 与 App Store Server API
- 开发计划拆分为三阶段，新增 Phase 2 订阅与商业化阶段
- 隐私安全新增订阅支付与取消相关说明

## [0.1.0] - 2026-02-09

### 新增
- 创建项目 README.md，包含完整的项目介绍、核心功能、技术架构、使用流程等内容
- 创建 CHANGELOG.md 变更日志文件
