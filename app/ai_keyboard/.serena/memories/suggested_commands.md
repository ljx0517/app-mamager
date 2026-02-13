# 常用命令

## 项目生成与打开

### 使用 XcodeGen 生成项目
```bash
# 安装 XcodeGen（如未安装）
brew install xcodegen

# 生成 Xcode 项目文件
xcodegen generate
```

### 打开项目
```bash
open AIKeyboard.xcodeproj
```

## 构建与运行

### 构建项目（Debug）
```bash
xcodebuild -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 15'
```

### 构建项目（Release）
```bash
xcodebuild -project AIKeyboard.xcodeproj -scheme AIKeyboard -configuration Release -destination 'platform=iOS Simulator,name=iPhone 15'
```

### 清理构建
```bash
xcodebuild clean -project AIKeyboard.xcodeproj
```

## 测试

### 运行单元测试
```bash
xcodebuild test -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 15'
```

### 在 Xcode 中运行测试
- 快捷键：`Cmd+U`

## 代码质量

### SwiftLint（如配置）
```bash
# 安装 SwiftLint
brew install swiftlint

# 运行检查
swiftlint
```

### SwiftFormat（如配置）
```bash
# 安装 SwiftFormat
brew install swiftformat

# 格式化代码
swiftformat .
```

## 依赖管理

本项目使用 Swift Package Manager（SPM）内置于 Xcode。在 Xcode 中添加依赖：
1. 打开项目设置
2. 选择 "Package Dependencies"
3. 点击 "+" 添加包

## 键盘扩展调试

键盘扩展需要在真实的 iOS 设备上测试，或使用特定的模拟器配置。建议：
1. 连接 iOS 设备
2. 选择 "AIKeyboard" scheme
3. 运行应用
4. 在设置中启用键盘并切换到该键盘

## Git 操作

### 提交前检查
```bash
# 运行测试
xcodebuild test -project AIKeyboard.xcodeproj -scheme AIKeyboard -destination 'platform=iOS Simulator,name=iPhone 15'

# 如有配置，运行代码检查
# swiftlint
# swiftformat --lint .
```

### 项目结构生成
```bash
# 更新 project.yml 后重新生成项目
xcodegen generate
```