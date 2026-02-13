# 代码风格与约定

## 语言与版本
- **Swift 5.9+**
- **iOS 16.0+** 为目标平台
- 使用 **SwiftUI**（主应用）和 **UIKit**（键盘扩展）

## 命名约定

### 类型命名
- 类、结构体、枚举、协议：大驼峰式（`PascalCase`）
  - `SpeakingStyle`, `SubscriptionStatus`, `KeyboardViewController`
- 枚举成员：小驼峰式（`camelCase`）
  - `case proMonthly`, `case proYearly`

### 变量与属性
- 变量、常量、属性：小驼峰式（`camelCase`）
  - `let styleManager`, `var isActive`, `private let clipboardService`
- 静态常量：小驼峰式
  - `static let appGroupID`

### 函数与方法
- 函数名：小驼峰式，动词开头
  - `func generateReply()`, `func loadFromAppGroup()`
- 参数名：小驼峰式
  - `func truncated(to maxLength: Int)`

### 文件命名
- Swift 文件：大驼峰式，与主类型一致
  - `SpeakingStyle.swift`, `KeyboardViewController.swift`
- 资源文件：小写蛇形命名（snake_case）或烤串命名（kebab-case）
  - `AppIcon.appiconset`, `AccentColor.colorset`

## 代码结构

### 导入语句
```swift
import Foundation
import SwiftUI
import UIKit
```
- 按框架分组，每行一个导入
- 按字母顺序排序（可选）

### 类型定义
- 优先使用 **结构体（struct）** 而非类
- 遵循协议：`Identifiable`, `Codable`, `Hashable` 等
- 示例：
```swift
struct SpeakingStyle: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    // ...
}
```

### 扩展使用
- 为现有类型添加功能时使用扩展
- 扩展按功能分组
```swift
extension String {
    var trimmed: String { /* ... */ }
    func truncated(to maxLength: Int) -> String { /* ... */ }
}
```

### 枚举定义
- 使用关联类型时明确命名
- 实现 `CaseIterable`, `Codable` 等协议
```swift
enum SubscriptionTier: String, Codable, CaseIterable {
    case free = "free"
    case proMonthly = "pro_monthly"
    // ...
}
```

## 注释与文档

### 中文注释
- 项目使用中文注释
- 类型和重要方法使用三斜线文档注释
```swift
/// 说话风格模型
struct SpeakingStyle: Identifiable, Codable {
    /// 风格名称
    var name: String
    // ...
}
```

### MARK 注释
- 使用 `// MARK: -` 分隔代码段
```swift
// MARK: - 生命周期

// MARK: - 公开方法

// MARK: - 私有方法
```

## 数据持久化

### App Group 共享
- 主应用与键盘扩展通过 App Group 共享数据
- 使用 `UserDefaults.shared`（自定义扩展）
- 存储订阅状态、用户配置等

### Codable 协议
- 模型结构体实现 `Codable` 协议
- 用于 JSON 编码/解码和 UserDefaults 存储

## 错误处理

### 错误枚举
- 定义本地化错误类型
```swift
enum KeyboardAIError: LocalizedError {
    case invalidURL
    case rateLimitExceeded
    // ...
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "API 地址配置错误"
        // ...
        }
    }
}
```

### 日志记录
- 使用 `AppLogger` 工具记录日志
- 分级：`debug`, `info`, `warning`, `error`

## 测试约定

### 单元测试
- 测试类继承自 `XCTestCase`
- 测试方法以 `test` 开头
- 使用 `@testable import AIKeyboard` 导入模块

### 测试组织
- 使用 `// MARK:` 分隔测试类别
```swift
// MARK: - SpeakingStyle Tests

// MARK: - Subscription Tests
```

## 项目结构约定

### 目录组织
```
AIKeyboard/          # 主应用
KeyboardExtension/   # 键盘扩展
Shared/             # 共享代码
  Constants/        # 常量定义
  Models/           # 数据模型
  Utils/            # 工具类
  Extensions/       # 扩展
Tests/              # 单元测试
```

### 资源管理
- 资源文件放入 `Resources/` 目录
- 使用 Asset Catalog 管理图片、颜色等

## 提交前检查
1. 运行单元测试：`xcodebuild test`
2. 确保代码编译通过
3. 检查是否有未使用的导入或变量