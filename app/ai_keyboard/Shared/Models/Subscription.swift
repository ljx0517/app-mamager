import Foundation

/// 订阅方案类型
public enum SubscriptionTier: String, Codable, CaseIterable {
    case free = "free"
    case proMonthly = "pro_monthly"
    case proYearly = "pro_yearly"
    
    /// App Store 中的商品 ID
    var productID: String {
        switch self {
        case .free: return ""
        case .proMonthly: return "com.jaxon.aikeyboard.pro.monthly"
        case .proYearly: return "com.jaxon.aikeyboard.pro.yearly"
        }
    }
    
    var displayName: String {
        switch self {
        case .free: return "免费版"
        case .proMonthly: return "Pro 月度"
        case .proYearly: return "Pro 年度"
        }
    }
    
    var isPro: Bool {
        self != .free
    }
    
    /// 所有付费商品 ID
    static var paidProductIDs: Set<String> {
        Set(
            Self.allCases
                .filter { $0 != .free }
                .map { $0.productID }
        )
    }
}

/// 订阅状态模型
public struct SubscriptionStatus: Codable {
    var tier: SubscriptionTier
    var isActive: Bool
    var expirationDate: Date?
    var isInTrialPeriod: Bool
    var willAutoRenew: Bool
    var originalTransactionID: String?
    
    /// 默认免费状态
    static let free = SubscriptionStatus(
        tier: .free,
        isActive: true,
        expirationDate: nil,
        isInTrialPeriod: false,
        willAutoRenew: false,
        originalTransactionID: nil
    )
    
    /// 是否为 Pro 用户
    var isPro: Bool {
        tier.isPro && isActive
    }
    
    /// 剩余天数
    var daysRemaining: Int? {
        guard let expirationDate else { return nil }
        let calendar = Calendar.current
        let days = calendar.dateComponents([.day], from: Date(), to: expirationDate).day
        return max(0, days ?? 0)
    }
    
    // MARK: - App Group 读写（主应用与键盘扩展共享）
    
    private static let storageKey = "subscription_status"
    
    /// 从 App Group 读取订阅状态（键盘扩展使用）
    static func loadFromAppGroup() -> SubscriptionStatus {
        guard let data = UserDefaults.shared.data(forKey: storageKey),
              let status = try? JSONDecoder().decode(SubscriptionStatus.self, from: data) else {
            return .free
        }
        return status
    }
    
    /// 保存订阅状态到 App Group（主应用使用）
    func saveToAppGroup() {
        if let data = try? JSONEncoder().encode(self) {
            UserDefaults.shared.set(data, forKey: Self.storageKey)
        }
    }
}
