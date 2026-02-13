import Foundation

/// 风格标签模型 - 细粒度的语言属性标签
public struct StyleTag: Identifiable, Codable, Hashable {
    public var id: UUID
    public var name: String               // 标签名称，如"使用 Emoji"
    public var description: String        // 标签描述，如"在回复中添加表情符号"
    public var promptFragment: String     // 标签对应的 prompt 片段
    public var category: TagCategory      // 标签分类
    public var icon: String              // SF Symbol 图标名称
    public var isBuiltIn: Bool           // 是否为内置标签
    public var isEnabled: Bool           // 是否启用
    public var createdAt: Date
    public var updatedAt: Date

    /// 标签分类
    public enum TagCategory: String, Codable, CaseIterable {
        case tone       = "tone"       // 语气
        case expression = "expression" // 表达方式
        case format     = "format"     // 格式
        case emotion    = "emotion"    // 情感
        case audience   = "audience"   // 受众

        public var displayName: String {
            switch self {
            case .tone: return "语气"
            case .expression: return "表达方式"
            case .format: return "格式"
            case .emotion: return "情感"
            case .audience: return "受众"
            }
        }

        public var icon: String {
            switch self {
            case .tone: return "waveform"
            case .expression: return "textformat"
            case .format: return "list.bullet"
            case .emotion: return "heart.fill"
            case .audience: return "person.2.fill"
            }
        }
    }

    public init(
        id: UUID = UUID(),
        name: String,
        description: String,
        promptFragment: String,
        category: TagCategory,
        icon: String = "tag.fill",
        isBuiltIn: Bool = false,
        isEnabled: Bool = true,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.promptFragment = promptFragment
        self.category = category
        self.icon = icon
        self.isBuiltIn = isBuiltIn
        self.isEnabled = isEnabled
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - 内置标签预设

extension StyleTag {
    /// 内置标签列表
    public static let builtInTags: [StyleTag] = [
        // 语气类标签
        StyleTag(
            name: "温柔体贴",
            description: "用温和、体贴的语气表达",
            promptFragment: "请用温柔体贴的语气回复，表达关心和理解",
            category: .tone,
            icon: "heart.fill",
            isBuiltIn: true
        ),
        StyleTag(
            name: "幽默风趣",
            description: "用幽默、轻松的语气表达",
            promptFragment: "请用幽默风趣的语气回复，可以使用俏皮话或双关语",
            category: .tone,
            icon: "face.smiling",
            isBuiltIn: true
        ),
        StyleTag(
            name: "正式专业",
            description: "用正式、专业的语气表达",
            promptFragment: "请用正式专业的语气回复，措辞严谨、逻辑清晰",
            category: .tone,
            icon: "briefcase.fill",
            isBuiltIn: true
        ),
        StyleTag(
            name: "直接犀利",
            description: "用直接、犀利的语气表达",
            promptFragment: "请用直接犀利的语气回复，观点鲜明、一针见血",
            category: .tone,
            icon: "bolt.fill",
            isBuiltIn: true
        ),

        // 表达方式类标签
        StyleTag(
            name: "使用 Emoji",
            description: "在回复中添加表情符号",
            promptFragment: "适当使用表情符号来增强情感表达",
            category: .expression,
            icon: "face.smiling.fill",
            isBuiltIn: true
        ),
        StyleTag(
            name: "使用网络用语",
            description: "使用流行的网络用语和表达",
            promptFragment: "可以使用适当的网络用语，让回复更贴近年轻人口语",
            category: .expression,
            icon: "network",
            isBuiltIn: true
        ),
        StyleTag(
            name: "使用比喻",
            description: "使用比喻和修辞手法",
            promptFragment: "可以使用比喻、拟人等修辞手法，让表达更生动",
            category: .expression,
            icon: "wand.and.stars",
            isBuiltIn: true
        ),

        // 格式类标签
        StyleTag(
            name: "简短回复",
            description: "回复简洁明了，直奔主题",
            promptFragment: "回复要简洁明了，避免冗长表述",
            category: .format,
            icon: "text.badge.minus",
            isBuiltIn: true
        ),
        StyleTag(
            name: "详细解释",
            description: "回复详细全面，包含解释",
            promptFragment: "回复可以详细一些，包含必要的解释和说明",
            category: .format,
            icon: "text.badge.plus",
            isBuiltIn: true
        ),
        StyleTag(
            name: "分点说明",
            description: "使用分点或列表形式",
            promptFragment: "可以使用分点或列表的形式组织回复内容",
            category: .format,
            icon: "list.bullet",
            isBuiltIn: true
        ),

        // 情感类标签
        StyleTag(
            name: "积极鼓励",
            description: "表达积极、鼓励的情感",
            promptFragment: "请表达积极鼓励的情感，给予对方支持",
            category: .emotion,
            icon: "hand.thumbsup.fill",
            isBuiltIn: true
        ),
        StyleTag(
            name: "共情理解",
            description: "表达理解和共情",
            promptFragment: "请表达理解和共情，让对方感到被理解",
            category: .emotion,
            icon: "brain.head.profile",
            isBuiltIn: true
        ),
        StyleTag(
            name: "冷静理性",
            description: "保持冷静、理性的情感",
            promptFragment: "请保持冷静理性的情感，客观分析问题",
            category: .emotion,
            icon: "brain",
            isBuiltIn: true
        ),

        // 受众类标签
        StyleTag(
            name: "对朋友",
            description: "适合与朋友交流的语气",
            promptFragment: "请用朋友间交流的亲切、随意的语气",
            category: .audience,
            icon: "person.fill",
            isBuiltIn: true
        ),
        StyleTag(
            name: "对同事",
            description: "适合与同事交流的语气",
            promptFragment: "请用同事间交流的礼貌、专业的语气",
            category: .audience,
            icon: "person.2.fill",
            isBuiltIn: true
        ),
        StyleTag(
            name: "对长辈",
            description: "适合与长辈交流的语气",
            promptFragment: "请用对长辈交流的尊敬、礼貌的语气",
            category: .audience,
            icon: "person.crop.circle.fill",
            isBuiltIn: true
        ),
    ]

    /// 按分类分组的内置标签
    public static var builtInTagsByCategory: [TagCategory: [StyleTag]] {
        var grouped: [TagCategory: [StyleTag]] = [:]
        for category in TagCategory.allCases {
            grouped[category] = builtInTags.filter { $0.category == category }
        }
        return grouped
    }
}