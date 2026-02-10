# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [0.6.0] - 2026-02-10

### 变更（重大重构）
- **多 App 架构升级**：管理后台从单一 AI Keyboard 管理重构为多应用统一管理平台
- 平台名称从 "AI Keyboard 管理后台" 更名为 "应用管理平台"
- 所有业务页面（仪表盘、用户管理、订阅管理、应用设置）均改为 App 感知模式
- 删除了 AI Keyboard 专属的"风格管理"页面，替换为通用的"数据分析"页面

### 新增
- **App 数据模型**（`AppInfo`）：
  - 支持 id、name、slug、description、icon、platform、bundleId、status 等字段
  - 平台类型：iOS / Android / Web / 跨平台
  - 状态管理：运行中 / 未激活 / 维护中 / 已归档
- **App 状态管理**（`appStore`）：
  - Zustand 持久化存储，维护 App 列表和当前选中的 App ID
  - 支持增删改查 + 切换当前 App
  - 内置 3 个模拟 App（AI Keyboard、AI Translator、AI Writer）
- **AppSwitcher 组件**：
  - 侧边栏 App 切换器，支持展开/收起两种展示模式
  - 下拉选项展示 App 图标、名称和状态标签
- **应用管理页面**（`/apps`）：
  - 4 个统计卡片（应用总数、运行中、维护中、iOS 应用）
  - 应用列表表格（图标、名称、Slug、描述、平台、Bundle ID、状态、更新时间）
  - 新增/编辑应用弹窗（名称、图标、Slug、描述、平台、状态、Bundle ID）
  - "进入"按钮一键切换到该应用上下文
  - 删除确认对话框
- **数据分析页面**（`/analytics`，替代原风格管理）：
  - Per-App 的 API 调用分析数据
  - 4 个核心指标卡片（总 API 调用、平均响应时间、错误率、高峰时段）
  - 热门接口 Top 5 表格（接口路径、调用次数、平均耗时、错误率）
  - 近 7 天趋势表格（日期、调用次数、错误数、错误率）
- **侧边栏布局重构**：
  - 顶部：平台 Logo + App 切换器
  - 中部：当前 App 业务菜单（仪表盘、用户管理、订阅管理、数据分析、应用设置）
  - 底部：平台管理菜单（应用管理）
  - 顶部栏显示当前 App 名称和图标
- **tRPC 客户端升级**：
  - 自动在请求头中附带 `x-app-id`，标识当前操作的应用
  - 从 Zustand 持久化存储中读取 App 上下文
- **Per-App 模拟数据**：
  - 仪表盘：每个 App 有独立的统计数据、最近用户、今日快报
  - 用户管理：按 App 过滤用户，不同 App 展示不同设备前缀和版本号
  - 订阅管理：按 App 过滤订阅记录
  - 应用设置：每个 App 有独立的 API 配置、AI 模型、订阅定价、安全配置
  - 数据分析：每个 App 有独立的 API 调用统计和接口排行
- **常量配置升级**：
  - 新增 App 状态/平台的标签和颜色映射
  - 移除 AI Keyboard 专属常量

## [0.5.0] - 2026-02-10

### 新增
- 在 `admin/` 目录下生成完整的 React 管理后台项目
- **技术栈**：Vite + React 19 + TypeScript + Ant Design 6 + Tailwind CSS 4 + tRPC 11 + React Query 5 + Zustand 5 + React Router 7
- **tRPC 集成**：
  - 配置 tRPC React Query 客户端，支持 HTTP 批量请求
  - 自动附带 JWT Token 的认证头
  - 占位 AppRouter 类型，可无缝对接服务端
  - Vite 代理配置 `/api/trpc` 到后端服务
- **管理布局**（`AdminLayout`）：
  - 可折叠侧边栏，含 Logo + 5 个导航菜单项
  - 顶部栏含折叠按钮、用户头像下拉菜单（个人信息 / 退出登录）
  - 响应式布局，Sticky 顶部栏
- **登录页**（`Login`）：
  - 渐变背景 + 居中卡片式登录表单
  - 表单校验、Loading 状态、模拟登录（admin / admin123）
  - 路由守卫：未登录重定向到登录页，已登录重定向到首页
- **仪表盘**（`Dashboard`）：
  - 4 个统计卡片（总用户数、活跃用户、Pro 会员、总收入），含趋势指示
  - 今日快报卡片（新增用户、AI 调用次数、新增/取消订阅）
  - 热门风格排行表格
  - 最近注册用户表格
- **用户管理**（`Users`）：
  - 搜索框 + 订阅方案/状态筛选 + 刷新/导出按钮
  - 分页数据表格（ID、设备ID、平台、版本、订阅方案、状态、注册/活跃时间）
  - 用户详情弹窗 + 禁用用户确认对话框
- **订阅管理**（`Subscriptions`）：
  - 4 个统计卡片（活跃订阅、月度会员、年度会员、试用用户）
  - 方案/状态筛选 + 日期范围选择器
  - 订阅数据表格（交易号、方案、状态、自动续费、起止时间）
- **风格管理**（`Styles`）：
  - 风格列表表格（图标、名称、描述、类型、使用次数）
  - 新增/编辑风格弹窗（名称、描述、Emoji、主题色、Prompt 模板、内置开关）
  - 删除确认 + 内置风格保护（不可删除）
- **系统设置**（`Settings`）：
  - Tab 分组：API 配置、订阅配置、通知配置、安全配置
  - API 配置：基础地址、AI 模型参数（Provider / Model / Tokens / Temperature）
  - 订阅配置：试用天数、免费/Pro 日配额、月度/年度定价
  - 通知配置：邮件通知开关、Slack Webhook、告警阈值
  - 安全配置：JWT Secret/过期天数、速率限制、IP 白名单
- **通用组件**：
  - `StatsCard` 统计卡片组件（支持图标、趋势、Loading）
  - `PageHeader` 页头组件（标题、副标题、面包屑、操作区）
- **状态管理**：
  - Zustand `authStore`（登录/登出/持久化到 localStorage）
  - 常量配置（菜单项、订阅标签/颜色、分页选项）
- **类型定义**：
  - User、Subscription、SpeakingStyle、DashboardStats 等完整 TypeScript 类型
  - 通用分页、API 响应类型
- **工程配置**：
  - Vite 路径别名 `@/` → `src/`
  - Tailwind CSS 全局样式（滚动条美化、页面过渡动画）
  - Ant Design ConfigProvider（中文语言包、主题定制）
  - dayjs 中文 locale
  - ESLint + TypeScript 严格模式

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
