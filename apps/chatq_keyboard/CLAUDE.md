# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个使用 Expo (SDK 54) + React Native 0.81.5 构建的跨平台移动应用项目。项目名称为 `your_keeboard`，是一个 AI 辅助回复键盘应用。

## Common Commands

```bash
# 启动开发服务器
npm start

# 运行 iOS 版本（需先执行 prebuild）
npm run ios

# 运行 Android 版本（需先执行 prebuild）
npm run android

# Web 版本
npm run web

# 生成本地原生代码（iOS/Android）
npx expo prebuild
```

## Development Notes

- 项目使用 `expo start --dev-client` 作为默认启动命令
- iOS 配置位于 `ios/` 目录
- Android 配置位于 `android/` 目录
- 入口文件为 `App.js`
- 开发时需要先运行 `npx expo prebuild` 生成原生项目代码，再运行 `npm run ios` 或 `npm run android`

## Architecture

### 核心架构
- **主应用**: React Native (Expo) 应用，管理对话历史和 AI 回复生成
- **键盘扩展**: 原生键盘实现 (iOS: Swift, Android: Java)
- **通信机制**: 键盘扩展 ↔ 主应用通过 URL Scheme、剪贴板、App Groups(iOS)/SharedPreferences(Android) 通信

### 状态管理
- 使用 React Context + useReducer 模式
- `ChatContext.tsx` 提供全局状态和业务逻辑

### 数据层
- SQLite (`expo-sqlite`) 存储对话和消息
- AsyncStorage 存储临时通信数据

### AI 服务
- 当前使用 mock 实现 (`src/services/api.ts`)
- TODO: 接入真实 AI API

## Project Structure

```
src/
├── types/
│   ├── index.ts              # 基础类型定义
│   └── communication.ts      # 通信协议类型
├── services/
│   ├── storage.ts            # SQLite 数据库操作
│   ├── api.ts                # AI 生成服务 (当前为 mock)
│   └── communication.ts      # 跨平台通信服务
├── context/
│   └── ChatContext.tsx       # 全局状态管理
└── App.js                    # 应用入口
```

## iOS Keyboard Extension

- 位置：`ios/YourKeeboardKeyboard/`
- 主要文件：`KeyboardViewController.swift`
- 使用方式：
  1. 在 Xcode 中打开 `ios/yourkeeboard.xcworkspace`
  2. 构建项目
  3. 在 iOS 设备/模拟器中：设置 → 通用 → 键盘 → 键盘 → 添加新键盘 → 选择 "Your Keeboard"
  4. 启用"允许完全访问"以支持网络请求和剪贴板

## Android Keyboard Extension

- 位置：`android/app/src/main/java/com/yourkeeboard/inputmethod/`
- 主要文件：`YourKeeboardInputMethod.java`
- 配置文件：`android/app/src/main/res/xml/method.xml`
- 使用方式：
  1. 构建 Android 项目
  2. 在 Android 设备中：设置 → 系统 → 键盘和输入法 → 虚拟键盘 → 添加新键盘
  3. 选择 "Your Keeboard"
  4. 在使用时切换到该键盘
