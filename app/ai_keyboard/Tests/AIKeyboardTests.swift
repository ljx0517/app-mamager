import XCTest
@testable import AIKeyboard

final class AIKeyboardTests: XCTestCase {
    
    // MARK: - SpeakingStyle Tests
    
    func testBuiltInStylesExist() {
        let styles = SpeakingStyle.builtInStyles
        XCTAssertFalse(styles.isEmpty, "内置风格不应为空")
        XCTAssertEqual(styles.count, 6, "应有 6 种内置风格")
    }
    
    func testBuiltInStylesAreBuiltIn() {
        for style in SpeakingStyle.builtInStyles {
            XCTAssertTrue(style.isBuiltIn, "\(style.name) 应标记为内置风格")
        }
    }
    
    func testStyleColorHex() {
        let style = SpeakingStyle.builtInStyles.first!
        XCTAssertNotNil(Color(hex: style.colorHex), "风格颜色 Hex 应有效")
    }
    
    // MARK: - StyleCombination Tests
    
    func testCombinedPromptSingleStyle() {
        let style = SpeakingStyle.builtInStyles[0]
        let combo = StyleCombination(
            name: "测试组合",
            styleIDs: [style.id]
        )
        
        let prompt = combo.combinedPrompt(styles: SpeakingStyle.builtInStyles)
        XCTAssertEqual(prompt, style.prompt, "单风格组合应返回该风格的 prompt")
    }
    
    func testCombinedPromptMultipleStyles() {
        let styles = Array(SpeakingStyle.builtInStyles.prefix(2))
        let combo = StyleCombination(
            name: "双风格",
            styleIDs: styles.map { $0.id },
            weights: Dictionary(uniqueKeysWithValues: styles.map { ($0.id, 0.5) })
        )
        
        let prompt = combo.combinedPrompt(styles: SpeakingStyle.builtInStyles)
        XCTAssertTrue(prompt.contains("融合"), "多风格 prompt 应包含融合说明")
    }
    
    // MARK: - Subscription Tests
    
    func testFreeSubscriptionStatus() {
        let status = SubscriptionStatus.free
        XCTAssertFalse(status.isPro, "免费版不应为 Pro")
        XCTAssertEqual(status.tier, .free)
        XCTAssertTrue(status.isActive)
    }
    
    func testProSubscriptionProductIDs() {
        let ids = SubscriptionTier.paidProductIDs
        XCTAssertEqual(ids.count, 2, "应有 2 个付费商品 ID")
        XCTAssertTrue(ids.contains(SubscriptionTier.proMonthly.productID))
        XCTAssertTrue(ids.contains(SubscriptionTier.proYearly.productID))
    }
    
    // MARK: - String Extension Tests
    
    func testStringTrimmed() {
        XCTAssertEqual("  hello  ".trimmed, "hello")
        XCTAssertEqual("\n test \n".trimmed, "test")
    }
    
    func testStringIsBlank() {
        XCTAssertTrue("".isBlank)
        XCTAssertTrue("   ".isBlank)
        XCTAssertTrue("\n\t".isBlank)
        XCTAssertFalse("hello".isBlank)
    }
    
    func testStringTruncated() {
        let long = "这是一段很长很长很长很长的文字内容用于测试截断功能"
        let truncated = long.truncated(to: 10)
        XCTAssertTrue(truncated.count <= 13) // 10 + "..."
        XCTAssertTrue(truncated.hasSuffix("..."))
    }
    
    // MARK: - Color Extension Tests
    
    func testColorFromHex() {
        XCTAssertNotNil(Color(hex: "#FF0000"))
        XCTAssertNotNil(Color(hex: "007AFF"))
        XCTAssertNil(Color(hex: "invalid"))
    }
    
    // MARK: - AppConstants Tests

    func testFreeUserLimits() {
        XCTAssertEqual(AppConstants.freeReplyLimitPerDay, 10)
        XCTAssertEqual(AppConstants.freeCandidateCount, 1)
    }

    // MARK: - DailyUsageManager Tests

    func testDailyUsageManagerProUser() {
        let proStatus = SubscriptionStatus(
            tier: .proMonthly,
            isActive: true,
            expirationDate: Date().addingTimeInterval(86400 * 30),
            isInTrialPeriod: false,
            willAutoRenew: true
        )

        let result = DailyUsageManager.shared.canGenerateReply(subscriptionStatus: proStatus)
        XCTAssertTrue(result.canGenerate, "Pro 用户应可以生成回复")
        XCTAssertEqual(result.remainingCount, Int.max, "Pro 用户剩余次数应为无限")
        XCTAssertEqual(result.limit, Int.max, "Pro 用户限制应为无限")
    }

    func testDailyUsageManagerFreeUserWithinLimit() {
        let freeStatus = SubscriptionStatus.free

        // 模拟重置计数
        UserDefaults.shared.set(0, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set("2024-01-01", forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        let result = DailyUsageManager.shared.canGenerateReply(subscriptionStatus: freeStatus)
        XCTAssertTrue(result.canGenerate, "免费用户在限制内应可以生成回复")
        XCTAssertEqual(result.remainingCount, 10, "免费用户初始剩余次数应为 10")
        XCTAssertEqual(result.limit, 10, "免费用户限制应为 10")
    }

    func testDailyUsageManagerFreeUserExceedsLimit() {
        let freeStatus = SubscriptionStatus.free

        // 模拟已达到限制
        UserDefaults.shared.set(10, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set("2024-01-01", forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        let result = DailyUsageManager.shared.canGenerateReply(subscriptionStatus: freeStatus)
        XCTAssertFalse(result.canGenerate, "免费用户达到限制后不应可以生成回复")
        XCTAssertEqual(result.remainingCount, 0, "免费用户达到限制后剩余次数应为 0")
        XCTAssertEqual(result.limit, 10, "免费用户限制应为 10")
    }

    func testDailyUsageManagerRecordUsage() {
        let freeStatus = SubscriptionStatus.free

        // 重置计数
        UserDefaults.shared.set(0, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set("2024-01-01", forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        // 记录使用
        DailyUsageManager.shared.recordReplyUsage(subscriptionStatus: freeStatus)

        let count = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        XCTAssertEqual(count, 1, "记录使用后计数应为 1")
    }

    func testDailyUsageManagerDateReset() {
        let freeStatus = SubscriptionStatus.free

        // 模拟昨天使用了 5 次
        UserDefaults.shared.set(5, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set("2023-12-31", forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        let result = DailyUsageManager.shared.canGenerateReply(subscriptionStatus: freeStatus)
        XCTAssertTrue(result.canGenerate, "新的一天应重置计数")
        XCTAssertEqual(result.remainingCount, 10, "新的一天剩余次数应为 10")

        // 检查是否已重置
        let newCount = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        XCTAssertEqual(newCount, 0, "新的一天计数应重置为 0")
    }

    func testDailyUsageManagerGetUsageInfo() {
        let freeStatus = SubscriptionStatus.free

        // 模拟使用了 3 次
        UserDefaults.shared.set(3, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set("2024-01-01", forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        let info = DailyUsageManager.shared.getUsageInfo(subscriptionStatus: freeStatus)
        XCTAssertEqual(info.used, 3, "已使用次数应为 3")
        XCTAssertEqual(info.remaining, 7, "剩余次数应为 7")
        XCTAssertEqual(info.limit, 10, "限制应为 10")
        XCTAssertFalse(info.isPro, "免费用户 isPro 应为 false")
    }

    func testDailyUsageManagerResetDailyCount() {
        // 模拟有数据
        UserDefaults.shared.set(5, forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        UserDefaults.shared.set("2024-01-01", forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        // 重置
        DailyUsageManager.shared.resetDailyCount()

        let count = UserDefaults.shared.integer(forKey: AppConstants.UserDefaultsKey.dailyReplyCount)
        let date = UserDefaults.shared.string(forKey: AppConstants.UserDefaultsKey.lastReplyDate)

        XCTAssertEqual(count, 0, "重置后计数应为 0")
        XCTAssertNotNil(date, "重置后应有日期")
    }
        XCTAssertEqual(AppConstants.freeStyleCount, 3)
    }
}
