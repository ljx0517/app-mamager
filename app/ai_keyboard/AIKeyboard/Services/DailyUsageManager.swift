import Foundation

/// 每日使用计数管理器
/// 负责管理免费用户的每日回复次数限制
public class DailyUsageManager {

    // MARK: - 单例实例

    public static let shared = DailyUsageManager()

    private init() {}

    // MARK: - 公共方法

    /// 检查是否可以生成回复
    /// - Parameter subscriptionStatus: 订阅状态
    /// - Returns: 是否可以生成回复，以及相关信息
    public func canGenerateReply(subscriptionStatus: SubscriptionStatus) -> (canGenerate: Bool, remainingCount: Int, limit: Int) {
        // Pro 用户无限制
        if subscriptionStatus.isPro {
            return (true, Int.max, Int.max)
        }

        // 免费用户检查每日限制
        let today = getTodayString()
        let lastDate = UserDefaults.shared.string(forKey: AppConstants.UserDefaultsKey.lastReplyDate) ?? ""
        var dailyCount = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)

        // 如果日期不是今天，重置计数
        if lastDate != today {
            dailyCount = 0
            UserDefaults.shared.set(dailyCount, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
            UserDefaults.shared.set(today, forKey: AppConstants.UserDefaultsKey.lastReplyDate)
        }

        let remaining = AppConstants.freeReplyLimitPerDay - dailyCount
        let canGenerate = remaining > 0

        return (canGenerate, remaining, AppConstants.freeReplyLimitPerDay)
    }

    /// 记录一次回复使用
    /// - Parameter subscriptionStatus: 订阅状态
    public func recordReplyUsage(subscriptionStatus: SubscriptionStatus) {
        // Pro 用户不记录使用次数
        if subscriptionStatus.isPro {
            return
        }

        let today = getTodayString()
        let lastDate = UserDefaults.shared.string(forKey: AppConstants.UserDefaultsKey.lastReplyDate) ?? ""
        var dailyCount = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)

        // 如果日期不是今天，重置计数
        if lastDate != today {
            dailyCount = 0
            UserDefaults.shared.set(today, forKey: AppConstants.UserDefaultsKey.lastReplyDate)
        }

        // 增加计数
        dailyCount += 1
        UserDefaults.shared.set(dailyCount, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)

        AppLogger.keyboard.info("📊 [DailyUsage] 记录回复使用，今日已使用: \(dailyCount)/\(AppConstants.freeReplyLimitPerDay)")
    }

    /// 重置每日计数（用于订阅状态变更时）
    public func resetDailyCount() {
        UserDefaults.shared.set(0, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set(getTodayString(), forKey: AppConstants.UserDefaultsKey.lastReplyDate)
        AppLogger.keyboard.info("📊 [DailyUsage] 重置每日计数")
    }

    /// 获取当前使用情况
    /// - Parameter subscriptionStatus: 订阅状态
    /// - Returns: 使用情况信息
    public func getUsageInfo(subscriptionStatus: SubscriptionStatus) -> (used: Int, remaining: Int, limit: Int, isPro: Bool) {
        if subscriptionStatus.isPro {
            return (0, Int.max, Int.max, true)
        }

        let today = getTodayString()
        let lastDate = UserDefaults.shared.string(forKey: AppConstants.UserDefaultsKey.lastReplyDate) ?? ""
        var dailyCount = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)

        // 如果日期不是今天，重置计数
        if lastDate != today {
            dailyCount = 0
            UserDefaults.shared.set(dailyCount, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
            UserDefaults.shared.set(today, forKey: AppConstants.UserDefaultsKey.lastReplyDate)
        }

        let remaining = AppConstants.freeReplyLimitPerDay - dailyCount
        return (dailyCount, remaining, AppConstants.freeReplyLimitPerDay, false)
    }

    // MARK: - 私有方法

    /// 获取今天的日期字符串（ISO 8601 年月日格式）
    private func getTodayString() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withYear, .withMonth, .withDay, .withDashSeparatorInDate]
        return formatter.string(from: Date())
    }
}