# CLAUDE.md

## 角色设定

- **角色**: 积极主动且热心的资深移动端开发专家
- **职责范围**: 仅处理本目录（`app/ai_keyboard`）的移动端代码
- **工作态度**: 积极主动，热心帮助
- **边界**: 不改动其他文件夹的代码，其他目录由其专属开发人员维护
- **产品思维**: 极致产品思维和创新思维
- **审视角度**: 站在 UX 设计师和技术架构师的双重立场审视产品功能
- **交互设计**: 重点关注移动端特有交互手势（长按、重压、滑动）简化操作路径
- **UE 细节**: 注重通过细节提升用户的情绪价值
- **建议标准**: 技术上惊艳，体验上自然

---

This file provides guidance to Claude Code (claude.ai/code) when working with the AI Keyboard iOS application.

## 项目概述

AI Keyboard 是一款智能风格化回复键盘，包含：
- **主应用** (AIKeyboard/): SwiftUI 应用，用于管理说话风格、订阅设置
- **键盘扩展** (KeyboardExtension/): UIKit 自定义键盘，读取剪贴板并生成风格化回复
- **共享代码** (Shared/): 主应用与扩展共享的模型、工具和扩展

核心功能：用户预设说话风格后，键盘自动读取剪贴板内容并生成个性化回复。

## 开发环境

- **Xcode 15.0+** 和 **iOS 16.0+** SDK
- 有效的 Apple 开发者账号（键盘扩展需要签名）
- 项目使用 **XcodeGen** 管理，配置文件为 `project.yml`

## 常用命令

### 项目生成与构建

```bash
# 使用 XcodeGen 生成 Xcode 项目（首次或修改 project.yml 后）
xcodegen generate --project project.yml
# 如果未安装 xcodegen: brew install xcodegen

# 打开 Xcode 项目
open AIKeyboard.xcodeproj

# 列出所有可用的 scheme
xcodebuild -project AIKeyboard.xcodeproj -list

# 命令行构建主应用
xcodebuild -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 16' build

# 命令行构建键盘扩展
xcodebuild -project AIKeyboard.xcodeproj -scheme KeyboardExtension -destination 'platform=iOS Simulator,name=iPhone 16' build

# 运行单元测试
xcodebuild test -project AIKeyboard.xcodeproj -scheme AIKeyboardTests -destination 'platform=iOS Simulator,name=iPhone 16'

# Xcode 中快速测试：Cmd+U

# 清理构建产物
xcodebuild clean -project AIKeyboard.xcodeproj -scheme AIKeyboard
```

### 模拟器目标

可用模拟器名称因 Xcode 版本而异。列出当前可用目标：
```bash
xcodebuild -project AIKeyboard.xcodeproj -scheme AIKeyboard -showdestinations
```

常见目标：`iPhone 16`, `iPhone 16 Pro`, `iPad (10th generation)` 等。

### 测试与调试

```bash
# 运行单个测试（示例：测试 String 扩展）
xcodebuild test -project AIKeyboard.xcodeproj -scheme AIKeyboardTests -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:AIKeyboardTests/testStringTrimmed

# 运行测试类中的所有测试
xcodebuild test -project AIKeyboard.xcodeproj -scheme AIKeyboardTests -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:AIKeyboardTests

# 清理构建产物
xcodebuild clean -project AIKeyboard.xcodeproj -scheme AIKeyboard

# 查看构建日志（详细模式）
xcodebuild -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 16' build -verbose

# 在 Xcode 中调试键盘扩展
# 1. 选择 KeyboardExtension scheme
# 2. 选择目标为 "AIKeyboard (Host App)" 或模拟器
# 3. 运行项目，键盘扩展会在主机应用中加载
```

### 后端依赖

iOS 应用依赖本地或远程后端服务提供 AI 生成和订阅验证功能：

```bash
# 进入后端目录（位于 monorepo 根目录的 server/）
cd ../../server

# 安装依赖并启动开发服务器（需要 Node.js 20+ 和 pnpm）
pnpm install
pnpm dev

# 默认开发服务器运行在 http://localhost:3000
# iOS 客户端配置在 Shared/Constants/APIConfig.swift 中
```

**重要**：开发时需确保后端服务正在运行，否则 AI 生成和订阅功能将不可用。生产版本使用配置的生产服务器 URL。

### Memory 记忆系统

项目集成了 Cursor Memory MCP 服务，用于记录开发过程中的重要上下文：

```bash
# 初始化项目 Memory（首次使用时自动调用）
mcp__memory__initializeMemory -path <项目内任意文件路径>

# 查看 Memory 状态看板
mcp__memory__getMemoryStatusBoard

# 检查 Memory 系统健康状态
mcp__memory__checkHealth

# 获取综合上下文（包含记忆、决策、里程碑等）
mcp__memory__getComprehensiveContext
```

**自动记忆功能**：
- 打开/编辑文件时自动记录到短期记忆
- 重要里程碑自动保存到长期记忆
- 记录关键设计决策和代码修改上下文

**常用 Memory 工具**：
| 工具 | 用途 |
|------|------|
| `mcp__memory__storeMilestone` | 记录里程碑 |
| `mcp__memory__storeDecision` | 记录设计决策 |
| `mcp__memory__storeRequirement` | 记录需求 |
| `mcp__memory__recordEpisode` | 记录重要事件 |
| `mcp__memory__getRecentEpisodes` | 获取最近的记忆 |

---

## 架构概述

### 项目结构

```
AIKeyboard/                    # 主应用 (SwiftUI)
├── App/AIKeyboardApp.swift    # 应用入口
├── Services/                  # 业务服务
│   ├── AIService.swift       # AI 回复生成
│   ├── ClipboardService.swift # 剪贴板管理
│   ├── StyleManager.swift    # 风格管理
│   └── TagManager.swift      # 标签管理（新增）
├── Views/                     # SwiftUI 视图
│   ├── ContentView.swift     # 主视图
│   ├── StyleListView.swift   # 风格列表
│   ├── TagSelectorView.swift # 标签选择器（新增）
│   └── TagCombinationEditorView.swift # 组合编辑器（新增）

KeyboardExtension/            # 键盘扩展 (UIKit)
├── KeyboardViewController.swift    # 键盘主控制器
├── Views/                    # 键盘界面组件
│   ├── KeyboardMainView.swift     # 键盘主视图
│   ├── ReplyCardView.swift        # 回复卡片
│   └── StyleSelectorView.swift    # 键盘内风格选择
└── Helpers/                 # 键盘专用工具
    ├── KeyboardAIService.swift    # 键盘 AI 服务适配
    └── KeyboardClipboardHelper.swift # 键盘剪贴板助手

Shared/                      # 共享代码
├── Models/                  # 数据模型
│   ├── SpeakingStyle.swift  # 说话风格
│   ├── StyleTag.swift       # 风格标签（新增）
│   ├── TagCombination.swift # 标签组合（新增）
│   ├── StyleCombination.swift # 风格组合
│   └── Subscription.swift   # 订阅状态
├── Constants/               # 常量定义
│   ├── AppConstants.swift   # 应用常量
│   └── APIConfig.swift      # API 配置
├── Extensions/              # Swift 扩展
│   ├── String+Extension.swift
│   ├── Color+Extension.swift
│   └── UserDefaults+AppGroup.swift # App Group 共享
└── Utils/AppLogger.swift    # 日志工具

Tests/                       # 单元测试
└── AIKeyboardTests.swift    # 主测试文件
```

### 核心数据模型

**说话风格体系**（新旧并存）：
1. **SpeakingStyle** (旧): 完整的说话风格定义，包含 prompt、emoji 频率、语气强度
2. **StyleTag** (新): 细粒度的语言属性标签（语气、表达方式、格式、情感、受众）
3. **TagCombination** (新): 多个 StyleTag 的组合，可转换为 SpeakingStyle
4. **StyleCombination** (旧): 多个 SpeakingStyle 的组合

**设计演进**：从固定的 SpeakingStyle 转向灵活的标签组合系统，支持用户自定义混合风格。

### 服务层架构

- **AIService**: 统一 AI 回复生成，处理认证、请求构建、错误处理
- **ClipboardService**: 剪贴板内容读取与监控
- **StyleManager**: 说话风格的本地存储与管理
- **TagManager**: 风格标签的管理与组合创建

### 数据共享机制

主应用与键盘扩展通过 **App Group Container** 共享数据：
- **App Group ID**: `group.com.jaxon.aikeyboard`
- **共享存储**: `UserDefaults(suiteName: appGroupID)`
- **共享数据**: 用户选择的风格、订阅状态、使用统计

### 认证与 API

- **TokenManager**: 管理访问令牌（Bearer Token）
- **API 端点配置**: `APIConfig.swift` 定义所有后端接口
- **多租户支持**: 通过 `x-api-key` 标识不同应用（当前为 AI Keyboard）

### 订阅系统

- **StoreKit 2**: 应用内购买管理
- **免费/Pro 功能分级**: 每日回复次数、候选回复数量、风格数量限制
- **本地验证**: 结合服务器验证与本地收据检查

## 关键文件

### 配置与入口

- `project.yml`: XcodeGen 项目配置，定义目标、依赖、构建设置
- `AIKeyboard/App/AIKeyboardApp.swift`: SwiftUI 应用入口点
- `KeyboardExtension/KeyboardViewController.swift`: 键盘扩展入口点
- `Shared/Constants/AppConstants.swift`: 全局常量（App Group、功能限制、通知名称）

### 核心业务逻辑

- `AIKeyboard/Services/AIService.swift`: AI 回复生成核心服务
- `AIKeyboard/Services/StyleManager.swift`: 说话风格管理
- `AIKeyboard/Services/TagManager.swift`: 风格标签管理（新增）
- `Shared/Models/StyleTag.swift`: 标签模型与内置预设
- `Shared/Models/TagCombination.swift`: 标签组合模型与转换逻辑

### 视图与交互

- `AIKeyboard/Views/ContentView.swift`: 主应用根视图
- `AIKeyboard/Views/TagSelectorView.swift`: 标签选择界面（新增）
- `AIKeyboard/Views/TagCombinationEditorView.swift`: 组合编辑器（新增）
- `KeyboardExtension/Views/KeyboardMainView.swift`: 键盘主界面
- `KeyboardExtension/Views/ReplyCardView.swift`: 回复卡片组件

### 数据与扩展

- `Shared/Extensions/UserDefaults+AppGroup.swift`: App Group 共享数据访问
- `Shared/Extensions/String+Extension.swift`: 字符串工具方法（如截断）
- `Shared/Utils/AppLogger.swift`: 结构化日志工具

## 开发注意事项

### 1. 键盘扩展限制
- 需要 "Allow Full Access" 权限才能读取剪贴板
- 内存限制严格，避免在扩展中加载大量数据
- 扩展与主应用通信必须通过 App Group

### 2. 数据模型兼容性
- 新旧风格系统共存，`TagCombination.toSpeakingStyle()` 提供兼容转换
- 修改模型时确保 Codable 一致性，避免破坏持久化数据
- 新增标签需在 `StyleTag.builtInTags` 中注册

### 3. 构建目标
- 主应用：`AIKeyboard` scheme (application)
- 键盘扩展：`KeyboardExtension` scheme (app-extension)
- 单元测试：`AIKeyboardTests` scheme (bundle.unit-test)

### 4. 代码风格
- Swift 5.9+ 语法，优先使用 Swift Concurrency (`async/await`)
- 遵循 MVVM 模式，视图与业务逻辑分离
- 使用 `AppLogger` 进行结构化日志记录
- 公共 API 需要 `public` 访问控制（特别是 Shared 中的代码）

### 5. 测试要点
- 单元测试覆盖模型转换、字符串扩展、颜色扩展
- 风格和标签的 Codable 一致性需要测试
- 键盘功能测试需要在实际设备上进行（模拟器限制）

### 6. API 配置与后端依赖
- 开发环境默认使用 `localhost:3000`，需要启动后端服务
- 生产环境 URL 在 `APIConfig.swift` 中配置
- AI 生成请求超时设置为 60 秒，普通请求 30 秒

### 7. 新增功能开发
1. **修改 project.yml** 添加新文件或目标
2. **运行 xcodegen generate** 更新项目
3. **保持公共符号的公开性** (`public`)，特别是 Shared 代码
4. **更新相关模型的内置预设** 如 `StyleTag.builtInTags`
5. **考虑键盘扩展的兼容性**，避免引入过重依赖

### 8. 调试技巧
- **键盘扩展调试**：选择 KeyboardExtension scheme，然后选择 "AIKeyboard (Host App)" 作为运行目标，这样扩展会在主应用中加载，便于调试
- **查看 App Group 数据**：使用 `UserDefaults.appGroup` 访问共享数据，可在代码中打印或使用调试器查看
- **网络请求日志**：检查 `AppLogger` 输出的网络请求和响应日志
- **模拟器剪贴板**：在模拟器中，可以通过菜单 "Edit → Paste" 模拟剪贴板内容，或使用 `UIPasteboard.general.string = "测试内容"`
- **后端服务健康检查**：访问 `http://localhost:3000/health` 验证后端服务是否正常

## 快速参考

### 生成新风格组合
```swift
let tags: [StyleTag] = StyleTag.builtInTags
let combination = TagCombination(
    name: "自定义组合",
    description: "描述",
    tagIDs: [tag1.id, tag2.id],
    weights: [tag1.id: 0.7, tag2.id: 0.3]
)
let speakingStyle = combination.toSpeakingStyle(tags: tags)
```

### 访问共享数据
```swift
let defaults = UserDefaults.appGroup
defaults.set(selectedStyleIDs, forKey: AppConstants.UserDefaultsKey.selectedStyleIDs)
```

### 构建检查清单
1. 修改 `project.yml` 后运行 `xcodegen generate`
2. 检查新增文件的 target membership
3. 确保 Shared 代码标记为 `public` 以支持跨目标访问
4. 运行单元测试验证修改
5. 分别在主应用和键盘扩展 scheme 中测试构建