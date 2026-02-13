import Foundation

/// 标签组合模型 - 将多个风格标签组合成一个完整的说话风格
public struct TagCombination: Identifiable, Codable, Hashable {
    public var id: UUID
    public var name: String
    public var description: String
    public var tagIDs: [UUID]               // 组合中包含的标签 ID 列表
    public var weights: [UUID: Double]      // 每个标签的权重 (0.0 ~ 1.0)，默认为 1.0
    public var isDefault: Bool              // 是否为默认组合
    public var isBuiltIn: Bool              // 是否为内置组合
    public var icon: String                 // 组合图标
    public var colorHex: String             // 组合主题色
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        name: String,
        description: String = "",
        tagIDs: [UUID],
        weights: [UUID: Double] = [:],
        isDefault: Bool = false,
        isBuiltIn: Bool = false,
        icon: String = "square.stack.fill",
        colorHex: String = "#007AFF",
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.tagIDs = tagIDs
        self.weights = weights
        self.isDefault = isDefault
        self.isBuiltIn = isBuiltIn
        self.icon = icon
        self.colorHex = colorHex
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    /// 生成组合的完整 prompt
    public func combinedPrompt(tags: [StyleTag]) -> String {
        let matchedTags = tagIDs.compactMap { id in
            tags.first(where: { $0.id == id })
        }

        guard !matchedTags.isEmpty else {
            return "请用自然、友好的语气回复。"
        }

        // 按分类分组标签
        let tagsByCategory = Dictionary(grouping: matchedTags) { $0.category }

        var promptParts: [String] = []

        // 1. 总体风格描述
        if matchedTags.count == 1, let tag = matchedTags.first {
            promptParts.append(tag.promptFragment)
        } else {
            promptParts.append("请融合以下多种语言特点来回复：")

            // 2. 按分类组织标签描述
            for (category, tagsInCategory) in tagsByCategory.sorted(by: { $0.key.rawValue < $1.key.rawValue }) {
                let tagDescriptions = tagsInCategory.map { tag in
                    let weight = weights[tag.id] ?? 1.0
                    let percentage = Int(weight * 100)
                    return "  - \(tag.name)(\(percentage)%): \(tag.promptFragment)"
                }.joined(separator: "\n")

                promptParts.append("\(category.displayName):")
                promptParts.append(tagDescriptions)
            }

            // 3. 融合指导
            promptParts.append("\n请自然地融合以上语言特点，生成一条流畅、自然的回复。")
        }

        return promptParts.joined(separator: "\n")
    }

    /// 转换为 SpeakingStyle（用于与现有系统兼容）
    public func toSpeakingStyle(tags: [StyleTag]) -> SpeakingStyle {
        SpeakingStyle(
            name: name,
            description: description,
            icon: icon,
            colorHex: colorHex,
            prompt: combinedPrompt(tags: tags),
            isBuiltIn: isBuiltIn,
            isEnabled: true,
            emojiFrequency: calculateEmojiFrequency(tags: tags),
            toneLevel: calculateToneLevel(tags: tags)
        )
    }

    /// 计算组合的 Emoji 使用频率
    private func calculateEmojiFrequency(tags: [StyleTag]) -> SpeakingStyle.EmojiFrequency {
        let matchedTags = tagIDs.compactMap { id in
            tags.first(where: { $0.id == id })
        }

        // 检查是否包含"使用 Emoji"标签
        if matchedTags.contains(where: { $0.name == "使用 Emoji" }) {
            return .medium
        }

        // 根据标签类型推断
        let hasEmotionalTags = matchedTags.contains { tag in
            tag.category == .emotion || tag.name.contains("幽默") || tag.name.contains("温柔")
        }

        return hasEmotionalTags ? .low : .none
    }

    /// 计算组合的语气强度 (1-5)
    private func calculateToneLevel(tags: [StyleTag]) -> Int {
        let matchedTags = tagIDs.compactMap { id in
            tags.first(where: { $0.id == id })
        }

        var toneLevel = 3 // 默认中等

        for tag in matchedTags {
            switch tag.name {
            case "温柔体贴", "共情理解":
                toneLevel = min(toneLevel - 1, 2)
            case "直接犀利":
                toneLevel = max(toneLevel + 1, 4)
            case "幽默风趣":
                toneLevel = 4
            case "正式专业", "冷静理性":
                toneLevel = 3
            default:
                break
            }
        }

        return min(max(toneLevel, 1), 5)
    }
}

// MARK: - 内置组合预设

extension TagCombination {
    /// 内置组合列表
    public static let builtInCombinations: [TagCombination] = [
        // 示例：幽默的朋友风格
        TagCombination(
            name: "幽默朋友",
            description: "适合与朋友开玩笑的幽默风格",
            tagIDs: [], // 实际会根据内置标签的ID动态设置
            isBuiltIn: true,
            icon: "face.smiling.fill",
            colorHex: "#FF9500"
        ),
        // 示例：专业同事风格
        TagCombination(
            name: "专业同事",
            description: "适合工作场合的专业沟通风格",
            tagIDs: [], // 实际会根据内置标签的ID动态设置
            isBuiltIn: true,
            icon: "briefcase.fill",
            colorHex: "#007AFF"
        ),
        // 示例：温柔长辈风格
        TagCombination(
            name: "温柔长辈",
            description: "适合与长辈交流的温柔体贴风格",
            tagIDs: [], // 实际会根据内置标签的ID动态设置
            isBuiltIn: true,
            icon: "heart.fill",
            colorHex: "#FF2D55"
        ),
    ]

    /// 创建默认组合（当用户没有设置时使用）
    public static func defaultCombination(tags: [StyleTag]) -> TagCombination {
        // 找到常用的几个标签
        let friendlyTag = tags.first { $0.name == "对朋友" }
        let naturalTag = tags.first { $0.name == "温柔体贴" }
        let emojiTag = tags.first { $0.name == "使用 Emoji" }

        var tagIDs: [UUID] = []
        if let friendlyTag = friendlyTag { tagIDs.append(friendlyTag.id) }
        if let naturalTag = naturalTag { tagIDs.append(naturalTag.id) }
        if let emojiTag = emojiTag { tagIDs.append(emojiTag.id) }

        return TagCombination(
            name: "自然友好",
            description: "默认的自然友好风格",
            tagIDs: tagIDs,
            isDefault: true,
            isBuiltIn: true,
            icon: "hand.wave.fill",
            colorHex: "#34C759"
        )
    }
}