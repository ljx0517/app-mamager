# Changelog

本文件记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

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
