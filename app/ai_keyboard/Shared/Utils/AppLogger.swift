import Foundation
import os

/// 统一日志工具
/// - DEBUG 模式：同时通过 print() 输出到 Xcode Console（方便调试，键盘扩展也能看到）
/// - RELEASE 模式：仅通过 os.Logger 写入系统日志（可在 Console.app 中查看）
enum AppLogger {
    
    // MARK: - 日志分类
    
    static let ai = AppLog(category: "AI")
    static let subscription = AppLog(category: "Subscription")
    static let clipboard = AppLog(category: "Clipboard")
    static let style = AppLog(category: "Style")
    static let network = AppLog(category: "Network")
    static let keyboard = AppLog(category: "Keyboard")
}

// MARK: - 日志实例

struct AppLog {
    private let logger: Logger
    private let category: String
    
    init(category: String) {
        self.category = category
        self.logger = Logger(subsystem: AppConstants.bundleID, category: category)
    }
    
    /// 普通信息日志
    func info(_ message: String) {
        logger.info("\(message, privacy: .public)")
        #if DEBUG
        printToConsole("ℹ️", message)
        #endif
    }
    
    /// 调试日志
    func debug(_ message: String) {
        logger.debug("\(message, privacy: .public)")
        #if DEBUG
        printToConsole("🔍", message)
        #endif
    }
    
    /// 警告日志
    func warning(_ message: String) {
        logger.warning("\(message, privacy: .public)")
        #if DEBUG
        printToConsole("⚠️", message)
        #endif
    }
    
    /// 错误日志
    func error(_ message: String) {
        logger.error("\(message, privacy: .public)")
        #if DEBUG
        printToConsole("❌", message)
        #endif
    }
    
    // MARK: - DEBUG print
    
    private func printToConsole(_ level: String, _ message: String) {
        let timestamp = Self.timeFormatter.string(from: Date())
        print("\(timestamp) \(level) [\(category)] \(message)")
    }
    
    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss.SSS"
        return f
    }()
}
