import Foundation
import SwiftUI

/// 说话风格模型
struct SpeakingStyle: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var description: String
    var icon: String                // SF Symbol 名称
    var colorHex: String            // 主题色 Hex 值
    var prompt: String              // 发送给 AI 的风格描述 prompt
    var isBuiltIn: Bool             // 是否为内置风格
    var isEnabled: Bool             // 是否已启用
    var emojiFrequency: EmojiFrequency  // Emoji 使用频率
    var toneLevel: Int              // 语气强度 1-5
    var createdAt: Date
    var updatedAt: Date
    
    /// Emoji 使用频率
    enum EmojiFrequency: String, Codable, CaseIterable {
        case none = "none"          // 不使用
        case low = "low"            // 偶尔使用
        case medium = "medium"      // 适度使用
        case high = "high"          // 大量使用
        
        var displayName: String {
            switch self {
            case .none: return "不使用"
            case .low: return "偶尔"
            case .medium: return "适度"
            case .high: return "大量"
            }
        }
    }
    
    /// 主题色
    var color: Color {
        Color(hex: colorHex) ?? .blue
    }
    
    init(
        id: UUID = UUID(),
        name: String,
        description: String,
        icon: String,
        colorHex: String,
        prompt: String,
        isBuiltIn: Bool = false,
        isEnabled: Bool = true,
        emojiFrequency: EmojiFrequency = .medium,
        toneLevel: Int = 3,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.icon = icon
        self.colorHex = colorHex
        self.prompt = prompt
        self.isBuiltIn = isBuiltIn
        self.isEnabled = isEnabled
        self.emojiFrequency = emojiFrequency
        self.toneLevel = toneLevel
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - 内置风格预设

extension SpeakingStyle {
    /// 内置风格列表
    static let builtInStyles: [SpeakingStyle] = [
        SpeakingStyle(
            name: "幽默",
            description: "轻松搞笑，用幽默化解一切",
            icon: "face.smiling",
            colorHex: "#FF9500",
            prompt: "请用幽默风趣的语气回复，可以适当使用俏皮话、双关语或轻松的玩笑，让对方会心一笑。",
            isBuiltIn: true,
            emojiFrequency: .high,
            toneLevel: 4
        ),
        SpeakingStyle(
            name: "正式",
            description: "专业得体，商务沟通首选",
            icon: "briefcase.fill",
            colorHex: "#007AFF",
            prompt: "请用正式、专业的语气回复，措辞严谨，逻辑清晰，适合商务或职场沟通场景。",
            isBuiltIn: true,
            emojiFrequency: .none,
            toneLevel: 3
        ),
        SpeakingStyle(
            name: "温柔",
            description: "温暖贴心，让人如沐春风",
            icon: "heart.fill",
            colorHex: "#FF2D55",
            prompt: "请用温柔体贴的语气回复，表达关心和理解，让对方感到温暖和被重视。",
            isBuiltIn: true,
            emojiFrequency: .medium,
            toneLevel: 2
        ),
        SpeakingStyle(
            name: "犀利",
            description: "一针见血，直击要害",
            icon: "bolt.fill",
            colorHex: "#FF3B30",
            prompt: "请用犀利直接的语气回复，观点鲜明，言辞锋利但不失分寸，一针见血。",
            isBuiltIn: true,
            emojiFrequency: .low,
            toneLevel: 5
        ),
        SpeakingStyle(
            name: "文艺",
            description: "诗意表达，文采飞扬",
            icon: "book.fill",
            colorHex: "#AF52DE",
            prompt: "请用文艺优美的语气回复，可以引用诗句或使用修辞手法，让语言充满美感和诗意。",
            isBuiltIn: true,
            emojiFrequency: .low,
            toneLevel: 3
        ),
        SpeakingStyle(
            name: "商务",
            description: "高效沟通，直奔主题",
            icon: "chart.line.uptrend.xyaxis",
            colorHex: "#34C759",
            prompt: "请用商务沟通的语气回复，重点突出，条理分明，高效传达信息，避免冗余表述。",
            isBuiltIn: true,
            emojiFrequency: .none,
            toneLevel: 3
        ),
    ]
}
