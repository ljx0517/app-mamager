# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个多租户 iOS 应用管理平台的 **monorepo**，包含：

- **admin/** - React 管理后台（多租户仪表盘）
- **server/** - Node.js 后端服务（tRPC + Fastify + Drizzle）
- **apps/chatq_keyboard** - React Native/Expo 键盘应用（开发中）

## Common Commands

```bash
# 安装根目录依赖
pnpm install

# 开发模式（并行运行所有子项目）
pnpm dev

# 构建所有子项目
pnpm build
```

## Architecture

### 技术栈

| 模块 | 技术 |
|------|------|
| 管理后台 | React 19 + tRPC + Zustand + Ant Design + Tailwind CSS |
| 后端服务 | Fastify + tRPC + Drizzle ORM + PostgreSQL + Redis |
| 键盘应用 | Expo (SDK 54) + React Native |

### 多租户架构

- **数据隔离**: 通过 `x-app-id` header 区分不同应用
- **配置共享**: 模板配置可复用到多个 App（configName）
- **认证层级**: `public → app → protected → admin`

## Sub-project CLAUDE.md

各子项目有独立的 CLAUDE.md，涵盖更详细的开发规范：

- **admin/** → `admin/CLAUDE.md`
- **server/** → `server/CLAUDE.md`
- **apps/chatq_keyboard/** → `apps/chatq_keyboard/CLAUDE.md`

## Database

- PostgreSQL + Drizzle ORM
- 开发时使用 `yarn db:studio` 打开 Drizzle Studio 查看数据

## Development Workflow

1. 先启动 backend: `cd server && yarn dev`
2. 再启动 admin: `cd admin && npm run dev`（端口 3100）
3. API 通过 tRPC 类型安全调用

## Environment Variables

### server/.env

必需: `DATABASE_URL`, `PORT`, `HOST`, `JWT_SECRET`

### admin

依赖 server 提供的 tRPC API，无需额外环境变量
