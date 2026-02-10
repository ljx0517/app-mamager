# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

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
