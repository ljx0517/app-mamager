import Foundation
import StoreKit
import Combine

/// 订阅管理服务 - 基于 StoreKit 2
@MainActor
class SubscriptionManager: ObservableObject {
    /// 当前订阅状态
    @Published var subscriptionStatus: SubscriptionStatus = .free
    
    /// 可用的订阅商品
    @Published var products: [Product] = []
    
    /// 是否正在加载
    @Published var isLoading = false
    
    /// 错误信息
    @Published var errorMessage: String?
    
    /// 交易监听任务
    private var transactionListener: Task<Void, Error>?
    
    init() {
        // 启动交易监听
        transactionListener = listenForTransactions()
    }
    
    deinit {
        transactionListener?.cancel()
    }
    
    // MARK: - 是否为 Pro 用户

    var isPro: Bool {
        subscriptionStatus.isPro
    }

    // MARK: - 权限检查

    /// 检查是否可以执行 AI 回复功能
    func canUseAIFeature() -> Bool {
        if isPro {
            return true
        }

        // 检查每日使用限制
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())

        // 获取上次使用日期
        let lastDate = UserDefaults.shared.object(forKey: AppConstants.UserDefaultsKey.lastReplyDate) as? Date
        let lastReplyDay = lastDate.map { calendar.startOfDay(for: $0) }

        // 如果是新的一天，重置计数
        if lastReplyDay != today {
            UserDefaults.shared.set(0, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
            UserDefaults.shared.set(Date(), forKey: AppConstants.UserDefaultsKey.lastReplyDate)
            return true
        }

        // 检查今日已使用次数
        let usedCount = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        return usedCount < AppConstants.freeReplyLimitPerDay
    }

    /// 记录一次 AI 回复使用
    func recordAIFeatureUsage() {
        guard !isPro else { return }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let lastDate = UserDefaults.shared.object(forKey: AppConstants.UserDefaultsKey.lastReplyDate) as? Date
        let lastReplyDay = lastDate.map { calendar.startOfDay(for: $0) }

        // 如果是新的一天，重置计数
        if lastReplyDay != today {
            UserDefaults.shared.set(1, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
            UserDefaults.shared.set(Date(), forKey: AppConstants.UserDefaultsKey.lastReplyDate)
        } else {
            // 增加计数
            let usedCount = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
            UserDefaults.shared.set(usedCount + 1, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        }
    }

    /// 获取今日已使用 AI 回复次数
    func getTodayAIFeatureUsage() -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let lastDate = UserDefaults.shared.object(forKey: AppConstants.UserDefaultsKey.lastReplyDate) as? Date
        let lastReplyDay = lastDate.map { calendar.startOfDay(for: $0) }

        // 如果是新的一天，返回0
        if lastReplyDay != today {
            return 0
        }

        return UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
    }

    /// 获取剩余可用 AI 回复次数
    func getRemainingAIFeatureUsage() -> Int {
        if isPro {
            return Int.max // 无限制
        }

        let used = getTodayAIFeatureUsage()
        return max(0, AppConstants.freeReplyLimitPerDay - used)
    }

    /// 检查是否可以创建自定义风格
    func canCreateCustomStyle(currentCount: Int) -> Bool {
        if isPro {
            return true // Pro用户无限制
        }
        return currentCount < AppConstants.freeCustomStyleCount
    }

    /// 检查是否可以添加更多基础风格
    func canAddMoreBaseStyle(currentCount: Int) -> Bool {
        if isPro {
            return true // Pro用户无限制
        }
        return currentCount < AppConstants.freeStyleCount
    }

    /// 获取候选回复数量
    func getCandidateCount() -> Int {
        if isPro {
            return AppConstants.proCandidateCount
        }
        return AppConstants.freeCandidateCount
    }

    /// 获取可用的基础风格数量限制
    func getBaseStyleLimit() -> Int {
        if isPro {
            return Int.max // 无限制
        }
        return AppConstants.freeStyleCount
    }

    /// 获取可用的自定义风格数量限制
    func getCustomStyleLimit() -> Int {
        if isPro {
            return Int.max // 无限制
        }
        return AppConstants.freeCustomStyleCount
    }
    
    // MARK: - 加载订阅状态
    
    /// 启动时加载订阅信息
    func loadSubscriptionStatus() async {
        isLoading = true
        defer { isLoading = false }
        
        // 1. 加载商品信息
        await fetchProducts()
        
        // 2. 检查本地订阅状态
        await updateSubscriptionStatus()
    }
    
    // MARK: - 获取商品列表
    
    /// 从 App Store 获取订阅商品信息
    func fetchProducts() async {
        do {
            let productIDs = SubscriptionTier.paidProductIDs
            let storeProducts = try await Product.products(for: productIDs)
            products = storeProducts.sorted { $0.price < $1.price }
        } catch {
            errorMessage = "无法加载订阅方案: \(error.localizedDescription)"
        }
    }
    
    // MARK: - 购买订阅
    
    /// 购买指定商品
    func purchase(_ product: Product) async throws -> Bool {
        isLoading = true
        defer { isLoading = false }
        
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            
            // 向服务端验证收据
            await verifyWithServer(transaction: transaction)
            
            // 更新本地状态
            await updateSubscriptionStatus()
            
            // 完成交易
            await transaction.finish()
            return true
            
        case .userCancelled:
            return false
            
        case .pending:
            errorMessage = "购买正在处理中，请稍候"
            return false
            
        @unknown default:
            return false
        }
    }
    
    // MARK: - 恢复购买
    
    /// 恢复之前的购买
    func restorePurchases() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await AppStore.sync()
            await updateSubscriptionStatus()
        } catch {
            errorMessage = "恢复购买失败: \(error.localizedDescription)"
        }
    }
    
    // MARK: - 更新订阅状态
    
    /// 检查当前订阅状态
    func updateSubscriptionStatus() async {
        var latestTransaction: Transaction?
        var latestExpiry: Date?
        
        for await result in Transaction.currentEntitlements {
            guard let transaction = try? checkVerified(result) else { continue }
            
            if let expiryDate = transaction.expirationDate {
                if latestExpiry == nil || expiryDate > latestExpiry! {
                    latestTransaction = transaction
                    latestExpiry = expiryDate
                }
            }
        }
        
        if let transaction = latestTransaction {
            let tier: SubscriptionTier
            if transaction.productID == SubscriptionTier.proMonthly.productID {
                tier = .proMonthly
            } else if transaction.productID == SubscriptionTier.proYearly.productID {
                tier = .proYearly
            } else {
                tier = .free
            }
            
            subscriptionStatus = SubscriptionStatus(
                tier: tier,
                isActive: transaction.revocationDate == nil,
                expirationDate: transaction.expirationDate,
                isInTrialPeriod: transaction.offerType == .introductory,
                willAutoRenew: true,
                originalTransactionID: String(transaction.originalID)
            )
        } else {
            subscriptionStatus = .free
        }
        
        // 同步到 App Group 供键盘扩展使用
        saveStatusToAppGroup()
        
        // 通知状态变更
        NotificationCenter.default.post(name: AppConstants.Notification.subscriptionStatusChanged, object: nil)
    }
    
    // MARK: - 交易监听
    
    /// 监听交易更新（自动续期、退款等）
    private func listenForTransactions() -> Task<Void, Error> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { break }
                if let transaction = try? self.checkVerified(result) {
                    await self.updateSubscriptionStatus()
                    await transaction.finish()
                }
            }
        }
    }
    
    // MARK: - 验证交易
    
    nonisolated private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let value):
            return value
        }
    }
    
    // MARK: - 服务端验证
    
    /// 将交易信息发送到服务端进行二次验证
    private func verifyWithServer(transaction: Transaction) async {
        // 服务端验证逻辑
        guard let url = URL(string: APIConfig.Subscription.verify) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = TokenManager.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let body: [String: Any] = [
            "transactionId": String(transaction.id),
            "originalTransactionId": String(transaction.originalID),
            "productId": transaction.productID,
            "environment": transaction.environment.rawValue
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let _ = try await URLSession.shared.data(for: request)
        } catch {
            // 服务端验证失败不影响本地体验，记录日志
            print("[SubscriptionManager] Server verification failed: \(error)")
        }
    }
    
    // MARK: - App Group 同步
    
    /// 将订阅状态保存到 App Group，供键盘扩展读取
    private func saveStatusToAppGroup() {
        subscriptionStatus.saveToAppGroup()
    }
}
