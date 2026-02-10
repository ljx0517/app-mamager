import UIKit
import Combine

/// 剪贴板监听服务
class ClipboardService: ObservableObject {
    static let shared = ClipboardService()
    
    /// 当前剪贴板文本内容
    @Published var clipboardText: String?
    
    /// 剪贴板变化次数记录（用于检测变化）
    private var lastChangeCount: Int = 0
    
    /// 定时器
    private var timer: Timer?
    
    private init() {
        lastChangeCount = UIPasteboard.general.changeCount
    }
    
    // MARK: - 开始监听
    
    /// 开始监听剪贴板变化
    func startMonitoring() {
        stopMonitoring()
        lastChangeCount = UIPasteboard.general.changeCount
        
        // 每 1 秒检查一次剪贴板
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.checkClipboard()
        }
    }
    
    /// 停止监听
    func stopMonitoring() {
        timer?.invalidate()
        timer = nil
    }
    
    // MARK: - 检查剪贴板
    
    private func checkClipboard() {
        let currentCount = UIPasteboard.general.changeCount
        
        guard currentCount != lastChangeCount else { return }
        lastChangeCount = currentCount
        
        if let text = UIPasteboard.general.string, !text.isBlank {
            DispatchQueue.main.async { [weak self] in
                self?.clipboardText = text.trimmed
                NotificationCenter.default.post(
                    name: AppConstants.Notification.clipboardContentChanged,
                    object: nil,
                    userInfo: ["text": text.trimmed]
                )
            }
        }
    }
    
    // MARK: - 手动读取
    
    /// 手动读取当前剪贴板内容
    func readClipboard() -> String? {
        guard let text = UIPasteboard.general.string, !text.isBlank else {
            return nil
        }
        clipboardText = text.trimmed
        return text.trimmed
    }
    
    /// 清除已读取的内容（避免重复触发）
    func clearReadContent() {
        clipboardText = nil
    }
}
