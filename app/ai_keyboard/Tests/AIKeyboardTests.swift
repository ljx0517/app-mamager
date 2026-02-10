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
        XCTAssertEqual(AppConstants.freeStyleCount, 3)
    }
}
