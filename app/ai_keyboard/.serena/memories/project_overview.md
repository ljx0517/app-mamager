# 项目概述

## 项目名称
**AI Keyboard** - 智能风格化回复键盘

## 项目目的
一款智能风格化回复键盘应用，用户预设说话风格后，键盘自动读取剪贴板内容并生成个性化回复。

## 核心功能
1. **说话风格管理**：内置多种风格（幽默、正式、温柔等），支持自定义
2. **键盘扩展**：iOS 键盘扩展读取剪贴板内容
3. **AI 回复生成**：基于用户选择的风格生成个性化回复
4. **订阅系统**：免费版有限制，Pro 版无限制
5. **多设备同步**：通过 App Group 共享数据

## 技术栈

### 前端（iOS 客户端）
- **语言**: Swift 5.9+
- **UI 框架**: SwiftUI（主应用） + UIKit（键盘扩展）
- **最低版本**: iOS 16.0+
- **应用内购买**: StoreKit 2
- **架构模式**: MVVM
- **项目管理**: XcodeGen + Xcode

### 后端（独立项目，位于 `../server/`）
- **框架**: Fastify + tRPC
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: API Key + Device ID 多层认证

### 数据共享
- **App Group**: 主应用与键盘扩展之间的数据共享
- **UserDefaults**: 通过自定义扩展 `UserDefaults+AppGroup.swift` 实现

## 项目结构

### 根目录
```
├── AIKeyboard/              # 主应用代码
│   ├── App/                # 应用入口
│   ├── Views/              # 视图组件
│   ├── Services/           # 业务服务
│   └── Resources/          # 资源文件
├── KeyboardExtension/      # 键盘扩展
│   ├── Views/              # 键盘视图
│   └── Helpers/            # 键盘助手
├── Shared/                 # 共享代码
│   ├── Constants/          # 常量定义
│   ├── Models/            # 数据模型
│   ├── Utils/             # 工具类
│   └── Extensions/        # Swift 扩展
├── Tests/                  # 单元测试
├── project.yml            # XcodeGen 配置文件
└── AIKeyboard.xcodeproj/  # Xcode 项目文件
```

### 关键文件
- **project.yml**: XcodeGen 配置，定义 targets、设置
- **AIKeyboardApp.swift**: 应用入口点
- **KeyboardViewController.swift**: 键盘扩展主控制器
- **SpeakingStyle.swift**: 核心数据模型
- **APIConfig.swift**: API 配置（开发/生产环境切换）

## 数据模型

### 说话风格 (SpeakingStyle)
- 包含名称、描述、图标、颜色、提示词等
- 支持自定义风格和内置风格
- 控制 Emoji 使用频率和语气强度

### 订阅系统 (Subscription)
- 三级：免费、Pro 月度、Pro 年度
- 状态管理：激活状态、过期时间、试用期等
- 通过 App Group 在主应用和键盘扩展间同步

### 风格组合 (StyleCombination)
- 支持多个风格融合，可调整权重
- 生成组合提示词

## 开发流程

### 环境设置
1. 安装 Xcode 15.0+
2. 安装 XcodeGen: `brew install xcodegen`
3. 生成项目: `xcodegen generate`
4. 打开项目: `open AIKeyboard.xcodeproj`

### 依赖管理
- 使用 Swift Package Manager（SPM）
- 在 Xcode 中添加包依赖

### 测试
- 单元测试位于 `Tests/` 目录
- 测试覆盖：数据模型、扩展、业务逻辑
- 运行命令: `xcodebuild test`

## 部署要求

### 应用商店
- 需要有效的 Apple 开发者账号
- 键盘扩展需要 "Allow Full Access" 权限
- 应用内购买配置

### 后端集成
- 开发环境: `http://localhost:3000/api`
- 生产环境: 需配置实际服务器地址
- API 认证: 需要 API Key 和 Token

## 多应用支持
系统设计支持管理多个独立应用（多租户），当前主要为 AI Keyboard 服务。

## 注意事项
1. 键盘扩展需要启用完全访问权限才能读取剪贴板
2. 订阅状态通过 App Group 共享，需确保 App Group 配置正确
3. 修改 API 配置时注意开发/生产环境切换
4. 数据库迁移需在后端项目执行