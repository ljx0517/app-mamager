import Foundation

/// 风格组合模型 - 支持将多种风格叠加混搭
public struct StyleCombination: Identifiable, Codable, Hashable {
    public let id: UUID
    public var name: String
    public var description: String
    public var styleIDs: [UUID]        // 组合中包含的风格 ID 列表
    public var weights: [UUID: Double] // 每种风格的权重 (0.0 ~ 1.0)
    public var isDefault: Bool         // 是否为默认组合
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: UUID = UUID(),
        name: String,
        description: String = "",
        styleIDs: [UUID],
        weights: [UUID: Double] = [:],
        isDefault: Bool = false,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.styleIDs = styleIDs
        self.weights = weights
        self.isDefault = isDefault
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    /// 生成组合 prompt：将多个风格的 prompt 按权重合并
    public func combinedPrompt(styles: [SpeakingStyle]) -> String {
        let matchedStyles = styleIDs.compactMap { id in
            styles.first(where: { $0.id == id })
        }
        
        guard !matchedStyles.isEmpty else { return "" }
        
        if matchedStyles.count == 1, let style = matchedStyles.first {
            return style.prompt
        }
        
        let styleDescriptions = matchedStyles.map { style in
            let weight = weights[style.id] ?? 1.0
            let percentage = Int(weight * 100)
            return "- \(style.name)风格(\(percentage)%): \(style.prompt)"
        }.joined(separator: "\n")
        
        return """
        请融合以下多种说话风格来回复，注意平衡各风格的比例：
        \(styleDescriptions)
        
        请自然地融合以上风格特点，生成一条流畅、自然的回复。
        """
    }
}

// MARK: - 预设组合

extension StyleCombination {
    public static let presets: [StyleCombination] = [
        // 示例预设，实际会基于用户配置的风格 ID 动态创建
    ]
}
