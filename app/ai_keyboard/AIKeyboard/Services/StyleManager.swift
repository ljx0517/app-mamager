import Foundation
import Combine

/// 风格管理服务 - 管理说话风格与风格组合
class StyleManager: ObservableObject {
    /// 所有可用风格（内置 + 自定义）
    @Published var styles: [SpeakingStyle] = []
    
    /// 所有风格组合
    @Published var combinations: [StyleCombination] = []
    
    /// 当前选中的风格 ID 列表
    @Published var selectedStyleIDs: Set<UUID> = []
    
    /// 当前选中的组合
    @Published var selectedCombination: StyleCombination?
    
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    // MARK: - 存储 Key
    
    private let stylesKey = "saved_styles"
    private let combinationsKey = "saved_combinations"
    
    init() {
        loadStyles()
        loadCombinations()
        loadSelectedStyles()
        setupNotificationListeners()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    // MARK: - 风格管理
    
    /// 加载风格列表
    func loadStyles() {
        var allStyles = SpeakingStyle.builtInStyles
        
        // 加载用户自定义风格
        if let data = UserDefaults.shared.data(forKey: stylesKey),
           let customStyles = try? decoder.decode([SpeakingStyle].self, from: data) {
            allStyles.append(contentsOf: customStyles)
        }
        
        styles = allStyles
    }
    
    /// 添加自定义风格
    /// - Parameters:
    ///   - style: 要添加的风格
    ///   - subscriptionManager: 订阅管理器，用于权限检查（可选）
    /// - Throws: 如果用户没有权限添加自定义风格
    func addStyle(_ style: SpeakingStyle, subscriptionManager: SubscriptionManager? = nil) throws {
        // 权限检查
        if let manager = subscriptionManager {
            let customStylesCount = styles.filter { !$0.isBuiltIn }.count
            if !manager.canCreateCustomStyle(currentCount: customStylesCount) {
                let limit = manager.getCustomStyleLimit()
                throw NSError(
                    domain: "StyleManager",
                    code: 403,
                    userInfo: [
                        NSLocalizedDescriptionKey: "无法添加更多自定义风格",
                        NSLocalizedRecoverySuggestionErrorKey: "免费用户最多可创建 \(limit) 个自定义风格。升级到 Pro 版可享受无限制自定义风格。"
                    ]
                )
            }
        }

        styles.append(style)
        saveCustomStyles()
        NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
    }
    
    /// 更新风格
    func updateStyle(_ style: SpeakingStyle) {
        if let index = styles.firstIndex(where: { $0.id == style.id }) {
            styles[index] = style
            saveCustomStyles()
            NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
        }
    }
    
    /// 删除自定义风格（内置风格不可删除）
    func deleteStyle(_ style: SpeakingStyle) {
        guard !style.isBuiltIn else { return }
        styles.removeAll(where: { $0.id == style.id })
        selectedStyleIDs.remove(style.id)
        saveCustomStyles()
        saveSelectedStyles()
    }
    
    /// 获取自定义风格数量
    var customStyleCount: Int {
        styles.filter { !$0.isBuiltIn }.count
    }
    
    // MARK: - 选中风格管理
    
    /// 切换风格选中状态
    /// 切换风格选择状态
    /// - Parameters:
    ///   - styleID: 风格ID
    ///   - subscriptionManager: 订阅管理器，用于权限检查（可选）
    /// - Throws: 如果用户没有权限选择更多基础风格
    func toggleStyleSelection(_ styleID: UUID, subscriptionManager: SubscriptionManager? = nil) throws {
        if selectedStyleIDs.contains(styleID) {
            // 取消选择不需要权限检查
            selectedStyleIDs.remove(styleID)
        } else {
            // 检查是否有权限选择更多基础风格
            if let manager = subscriptionManager {
                // 获取要选择的风格
                guard let style = styles.first(where: { $0.id == styleID }) else { return }

                // 只对基础风格进行限制检查
                if style.isBuiltIn {
                    let selectedBaseStylesCount = styles.filter {
                        selectedStyleIDs.contains($0.id) && $0.isBuiltIn
                    }.count

                    if !manager.canAddMoreBaseStyle(currentCount: selectedBaseStylesCount) {
                        let limit = manager.getBaseStyleLimit()
                        throw NSError(
                            domain: "StyleManager",
                            code: 403,
                            userInfo: [
                                NSLocalizedDescriptionKey: "无法选择更多基础风格",
                                NSLocalizedRecoverySuggestionErrorKey: "免费用户最多可选择 \(limit) 个基础风格。升级到 Pro 版可享受无限制风格选择。"
                            ]
                        )
                    }
                }
            }

            selectedStyleIDs.insert(styleID)
        }
        saveSelectedStyles()
        NotificationCenter.default.post(name: AppConstants.Notification.styleSelectionChanged, object: nil)
    }
    
    /// 获取当前选中风格的合并 prompt
    func currentPrompt() -> String {
        // 优先使用组合
        if let combination = selectedCombination {
            return combination.combinedPrompt(styles: styles)
        }
        
        // 否则合并选中的风格
        let selectedStyles = styles.filter { selectedStyleIDs.contains($0.id) }
        
        if selectedStyles.isEmpty {
            return "请用自然、友好的语气回复。"
        }
        
        if selectedStyles.count == 1, let style = selectedStyles.first {
            return style.prompt
        }
        
        let prompts = selectedStyles.map { "- \($0.name): \($0.prompt)" }.joined(separator: "\n")
        return "请融合以下风格来回复：\n\(prompts)\n\n请自然地融合以上风格特点。"
    }
    
    // MARK: - 组合管理
    
    /// 添加风格组合
    func addCombination(_ combination: StyleCombination) {
        combinations.append(combination)
        saveCombinations()
    }
    
    /// 删除风格组合
    func deleteCombination(_ combination: StyleCombination) {
        combinations.removeAll(where: { $0.id == combination.id })
        if selectedCombination?.id == combination.id {
            selectedCombination = nil
        }
        saveCombinations()
    }
    
    // MARK: - 持久化
    
    private func saveCustomStyles() {
        let customStyles = styles.filter { !$0.isBuiltIn }
        if let data = try? encoder.encode(customStyles) {
            UserDefaults.shared.set(data, forKey: stylesKey)
        }
    }
    
    private func saveCombinations() {
        if let data = try? encoder.encode(combinations) {
            UserDefaults.shared.set(data, forKey: combinationsKey)
        }
    }
    
    private func loadCombinations() {
        if let data = UserDefaults.shared.data(forKey: combinationsKey),
           let saved = try? decoder.decode([StyleCombination].self, from: data) {
            combinations = saved
        }
    }
    
    private func saveSelectedStyles() {
        let ids = selectedStyleIDs.map { $0.uuidString }
        UserDefaults.shared.set(ids, forKey: AppConstants.UserDefaultsKey.selectedStyleIDs)
    }
    
    private func loadSelectedStyles() {
        if let ids = UserDefaults.shared.stringArray(forKey: AppConstants.UserDefaultsKey.selectedStyleIDs) {
            selectedStyleIDs = Set(ids.compactMap { UUID(uuidString: $0) })
        }
    }

    // MARK: - 通知监听

    private func setupNotificationListeners() {
        NotificationCenter.default.addObserver(
            forName: AppConstants.Notification.tagCombinationSelectionChanged,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.clearSelection()
        }
    }

    /// 清除所有选中风格（不发送通知）
    private func clearSelection() {
        selectedStyleIDs.removeAll()
        selectedCombination = nil
        saveSelectedStyles()
    }
}
