import UIKit
import Combine

/// 键盘扩展的剪贴板辅助工具
/// 注意：键盘扩展需要 RequestsOpenAccess 权限才能读取剪贴板
class KeyboardClipboardHelper: ObservableObject {
    /// 当前剪贴板文本（@Published 驱动 UI 更新）
    @Published var clipboardText: String?
    
    /// 剪贴板内容是否刚刚发生了变化（用于通知 View 层清除旧回复）
    @Published var contentDidChange: Bool = false
    
    /// 上次检查的 changeCount
    private var lastChangeCount: Int = 0
    
    /// 轮询定时器
    private var pollTimer: Timer?
    
    /// 轮询间隔（秒）
    private let pollInterval: TimeInterval = 0.8
    
    init() {
        lastChangeCount = UIPasteboard.general.changeCount
    }
    
    deinit {
        stopMonitoring()
    }
    
    // MARK: - 开始/停止监听
    
    /// 开始持续监听剪贴板变化
    func startMonitoring() {
        stopMonitoring()
        
        // 先立即检查一次
        checkClipboard()
        
        // 启动定时器持续轮询
        pollTimer = Timer.scheduledTimer(withTimeInterval: pollInterval, repeats: true) { [weak self] _ in
            self?.checkClipboard()
        }
        
        AppLogger.clipboard.info("📋 [Clipboard] 开始监听剪贴板变化，间隔: \(self.pollInterval)s")
    }
    
    /// 停止监听
    func stopMonitoring() {
        pollTimer?.invalidate()
        pollTimer = nil
    }
    
    // MARK: - 检查剪贴板
    
    /// 检查剪贴板是否有新内容
    func checkClipboard() {
        let currentCount = UIPasteboard.general.changeCount
        
        // changeCount 未变且已有内容，无需更新
        guard currentCount != lastChangeCount || clipboardText == nil else { return }
        
        let isNewContent = currentCount != lastChangeCount && clipboardText != nil
        lastChangeCount = currentCount
        
        if let text = UIPasteboard.general.string, !text.isBlank {
            let newText = text.trimmed
            
            // 只有内容确实不同时才更新
            if newText != clipboardText {
                AppLogger.clipboard.info("📋 [Clipboard] 检测到新内容: \(newText.truncated(to: 50))")
                clipboardText = newText
                
                // 标记内容已变化，通知 View 层
                if isNewContent {
                    contentDidChange = true
                }
            }
        }
    }
    
    /// 重置变化标记（View 层处理完后调用）
    func acknowledgeChange() {
        contentDidChange = false
    }
    
    /// 清除已处理的内容
    func clearContent() {
        clipboardText = nil
        contentDidChange = false
    }
}
