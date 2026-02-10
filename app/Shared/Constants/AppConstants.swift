import Foundation

/// 全局常量定义
enum AppConstants {
    /// App Group ID，用于主应用与键盘扩展之间的数据共享
    static let appGroupID = "group.com.jaxon.aikeyboard"
    
    /// App 名称
    static let appName = "AI Keyboard"
    
    /// Bundle ID
    static let bundleID = "com.jaxon.aikeyboard"
    
    // MARK: - 免费用户限制
    
    /// 免费版每日 AI 回复次数上限
    static let freeReplyLimitPerDay = 10
    
    /// 免费版候选回复数量
    static let freeCandidateCount = 1
    
    /// 免费版基础风格数量
    static let freeStyleCount = 3
    
    /// 免费版自定义风格数量
    static let freeCustomStyleCount = 1
    
    // MARK: - Pro 用户配置
    
    /// Pro 版候选回复数量
    static let proCandidateCount = 5
    
    // MARK: - UserDefaults Keys
    
    enum UserDefaultsKey {
        static let selectedStyleIDs = "selected_style_ids"
        static let dailyReplyCount = "daily_reply_count"
        static let lastReplyDate = "last_reply_date"
        static let hasCompletedOnboarding = "has_completed_onboarding"
        static let preferredAIModel = "preferred_ai_model"
    }
    
    // MARK: - Notification Names
    
    enum Notification {
        static let subscriptionStatusChanged = Foundation.Notification.Name("subscriptionStatusChanged")
        static let styleUpdated = Foundation.Notification.Name("styleUpdated")
        static let clipboardContentChanged = Foundation.Notification.Name("clipboardContentChanged")
    }
}
