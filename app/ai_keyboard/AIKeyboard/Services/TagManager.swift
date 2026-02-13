import Foundation
import Combine
import SwiftUI

/// 标签管理服务 - 管理风格标签和标签组合
@MainActor
public class TagManager: ObservableObject {
    /// 所有可用标签（内置 + 自定义）
    @Published var tags: [StyleTag] = []

    /// 所有标签组合
    @Published var combinations: [TagCombination] = []

    /// 当前选中的标签组合 ID
    @Published var selectedCombinationID: UUID?

    /// 默认组合 ID
    @Published var defaultCombinationID: UUID?

    /// 是否正在加载
    @Published var isLoading = false

    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // MARK: - 存储 Key

    private let tagsKey = "saved_style_tags"
    private let combinationsKey = "saved_tag_combinations"
    private let selectedCombinationKey = "selected_tag_combination_id"
    private let defaultCombinationKey = "default_tag_combination_id"

    // 单例模式（可选，也可作为环境对象注入）
    public static let shared = TagManager()

    private init() {
        loadAllData()
        setupNotificationListeners()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - 数据加载

    /// 加载所有标签和组合数据
    private func loadAllData() {
        loadTags()
        loadCombinations()
        loadSelectedCombination()
        loadDefaultCombination()

        // 如果没有默认组合，创建一个
        if defaultCombinationID == nil && !combinations.isEmpty {
            setDefaultCombination(combinations.first!)
        } else {
            syncCurrentCombinationToAppGroup()
        }
    }

    /// 加载标签列表
    private func loadTags() {
        var allTags = StyleTag.builtInTags

        // 加载用户自定义标签
        if let data = UserDefaults.shared.data(forKey: tagsKey),
           let customTags = try? decoder.decode([StyleTag].self, from: data) {
            allTags.append(contentsOf: customTags)
        }

        tags = allTags
    }

    /// 加载组合列表
    private func loadCombinations() {
        var allCombinations: [TagCombination] = []

        // 加载用户自定义组合
        if let data = UserDefaults.shared.data(forKey: combinationsKey),
           let savedCombinations = try? decoder.decode([TagCombination].self, from: data) {
            allCombinations.append(contentsOf: savedCombinations)
        }

        // 如果没有组合，创建一些基于内置标签的预设组合
        if allCombinations.isEmpty {
            allCombinations = createInitialCombinations()
        }

        combinations = allCombinations
    }

    /// 加载选中的组合
    private func loadSelectedCombination() {
        if let idString = UserDefaults.shared.string(forKey: selectedCombinationKey),
           let id = UUID(uuidString: idString) {
            selectedCombinationID = id
        }
    }

    /// 加载默认组合
    private func loadDefaultCombination() {
        if let idString = UserDefaults.shared.string(forKey: defaultCombinationKey),
           let id = UUID(uuidString: idString) {
            defaultCombinationID = id
        }
    }

    // MARK: - 标签管理

    /// 添加自定义标签
    func addTag(_ tag: StyleTag) {
        tags.append(tag)
        saveCustomTags()
        NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
    }

    /// 更新标签
    func updateTag(_ tag: StyleTag) {
        if let index = tags.firstIndex(where: { $0.id == tag.id }) {
            tags[index] = tag
            saveCustomTags()
            NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
        }
    }

    /// 删除自定义标签（内置标签不可删除）
    func deleteTag(_ tag: StyleTag) {
        guard !tag.isBuiltIn else { return }

        // 删除标签
        tags.removeAll(where: { $0.id == tag.id })
        saveCustomTags()

        // 清理包含该标签的组合
        cleanupCombinationsAfterTagDeletion(tagID: tag.id)
    }

    /// 获取自定义标签数量
    var customTagCount: Int {
        tags.filter { !$0.isBuiltIn }.count
    }

    /// 按分类分组的标签
    var tagsByCategory: [StyleTag.TagCategory: [StyleTag]] {
        var grouped: [StyleTag.TagCategory: [StyleTag]] = [:]
        for category in StyleTag.TagCategory.allCases {
            grouped[category] = tags.filter { $0.category == category && $0.isEnabled }
        }
        return grouped
    }

    // MARK: - 组合管理

    /// 添加标签组合
    func addCombination(_ combination: TagCombination) {
        combinations.append(combination)
        saveCombinations()

        // 如果是第一个组合，自动设为默认
        if combinations.count == 1 {
            setDefaultCombination(combination)
        } else {
            syncCurrentCombinationToAppGroup()
        }

        NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
    }

    /// 更新组合
    func updateCombination(_ combination: TagCombination) {
        if let index = combinations.firstIndex(where: { $0.id == combination.id }) {
            combinations[index] = combination
            saveCombinations()
            syncCurrentCombinationToAppGroup()
            NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
        }
    }

    /// 删除组合
    func deleteCombination(_ combination: TagCombination) {
        combinations.removeAll(where: { $0.id == combination.id })
        saveCombinations()

        // 如果删除的是选中的组合，清除选中状态
        if selectedCombinationID == combination.id {
            selectedCombinationID = nil
            saveSelectedCombination()
        }

        // 如果删除的是默认组合，重新选择默认
        if defaultCombinationID == combination.id {
            defaultCombinationID = combinations.first?.id
            saveDefaultCombination()
        }

        syncCurrentCombinationToAppGroup()
        NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
    }

    /// 设置默认组合
    func setDefaultCombination(_ combination: TagCombination) {
        defaultCombinationID = combination.id
        saveDefaultCombination()
        syncCurrentCombinationToAppGroup()
        NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
    }

    /// 获取默认组合
    var defaultCombination: TagCombination? {
        guard let id = defaultCombinationID else { return nil }
        return combinations.first { $0.id == id }
    }

    /// 获取当前选中的组合（优先选中的，其次默认的）
    var currentCombination: TagCombination? {
        if let selectedID = selectedCombinationID,
           let combination = combinations.first(where: { $0.id == selectedID }) {
            return combination
        }
        return defaultCombination
    }

    /// 获取当前组合的 prompt
    var currentPrompt: String {
        guard let combination = currentCombination else {
            return "请用自然、友好的语气回复。"
        }
        return combination.combinedPrompt(tags: tags)
    }

    /// 选择组合
    func selectCombination(_ combination: TagCombination?) {
        selectedCombinationID = combination?.id
        saveSelectedCombination()
        syncCurrentCombinationToAppGroup()
        NotificationCenter.default.post(name: AppConstants.Notification.tagCombinationSelectionChanged, object: nil)
        NotificationCenter.default.post(name: AppConstants.Notification.styleUpdated, object: nil)
    }

    // MARK: - 辅助方法

    /// 清理包含已删除标签的组合
    private func cleanupCombinationsAfterTagDeletion(tagID: UUID) {
        var needsSave = false

        for i in combinations.indices {
            if combinations[i].tagIDs.contains(tagID) {
                combinations[i].tagIDs.removeAll { $0 == tagID }
                combinations[i].weights.removeValue(forKey: tagID)
                needsSave = true
            }
        }

        if needsSave {
            saveCombinations()
        }
    }

    /// 创建初始组合（基于内置标签）
    private func createInitialCombinations() -> [TagCombination] {
        var initialCombinations: [TagCombination] = []

        // 获取内置标签
        let builtInTags = StyleTag.builtInTags

        // 1. 幽默朋友组合
        if let humorTag = builtInTags.first(where: { $0.name == "幽默风趣" }),
           let friendTag = builtInTags.first(where: { $0.name == "对朋友" }),
           let emojiTag = builtInTags.first(where: { $0.name == "使用 Emoji" }) {

            let combination = TagCombination(
                name: "幽默朋友",
                description: "适合与朋友开玩笑的幽默风格",
                tagIDs: [humorTag.id, friendTag.id, emojiTag.id],
                weights: [
                    humorTag.id: 0.6,
                    friendTag.id: 0.3,
                    emojiTag.id: 0.4
                ],
                isBuiltIn: true,
                icon: "face.smiling.fill",
                colorHex: "#FF9500"
            )
            initialCombinations.append(combination)
        }

        // 2. 专业同事组合
        if let formalTag = builtInTags.first(where: { $0.name == "正式专业" }),
           let colleagueTag = builtInTags.first(where: { $0.name == "对同事" }),
           let conciseTag = builtInTags.first(where: { $0.name == "简短回复" }) {

            let combination = TagCombination(
                name: "专业同事",
                description: "适合工作场合的专业沟通风格",
                tagIDs: [formalTag.id, colleagueTag.id, conciseTag.id],
                weights: [
                    formalTag.id: 0.7,
                    colleagueTag.id: 0.3,
                    conciseTag.id: 0.5
                ],
                isBuiltIn: true,
                icon: "briefcase.fill",
                colorHex: "#007AFF"
            )
            initialCombinations.append(combination)
        }

        return initialCombinations
    }

    // MARK: - 持久化

    private func saveCustomTags() {
        let customTags = tags.filter { !$0.isBuiltIn }
        if let data = try? encoder.encode(customTags) {
            UserDefaults.shared.set(data, forKey: tagsKey)
        }
    }

    private func saveCombinations() {
        if let data = try? encoder.encode(combinations) {
            UserDefaults.shared.set(data, forKey: combinationsKey)
        }
    }

    private func saveSelectedCombination() {
        if let id = selectedCombinationID {
            UserDefaults.shared.set(id.uuidString, forKey: selectedCombinationKey)
        } else {
            UserDefaults.shared.removeObject(forKey: selectedCombinationKey)
        }
    }

    private func saveDefaultCombination() {
        if let id = defaultCombinationID {
            UserDefaults.shared.set(id.uuidString, forKey: defaultCombinationKey)
        }
    }

    // MARK: - 通知监听

    private func setupNotificationListeners() {
        NotificationCenter.default.addObserver(
            forName: AppConstants.Notification.styleSelectionChanged,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.clearSelection()
        }
    }

    /// 清除选中的组合（不发送通知）
    private func clearSelection() {
        selectedCombinationID = nil
        saveSelectedCombination()
        syncCurrentCombinationToAppGroup()
    }

    // MARK: - App Group 同步

    /// 同步当前组合到 App Group，供键盘扩展使用
    func syncCurrentCombinationToAppGroup() {
        guard let combination = currentCombination else {
            // 没有当前组合，清除 App Group 中的数据
            UserDefaults.shared.removeObject(forKey: "current_tag_combination_id")
            UserDefaults.shared.removeObject(forKey: "current_tag_combination_prompt")
            UserDefaults.shared.removeObject(forKey: "current_tag_combination_info")
            return
        }

        // 保存组合 ID 到 App Group
        UserDefaults.shared.set(combination.id.uuidString, forKey: "current_tag_combination_id")

        // 保存组合的完整 prompt 到 App Group（供键盘快速读取）
        let prompt = combination.combinedPrompt(tags: tags)
        UserDefaults.shared.set(prompt, forKey: "current_tag_combination_prompt")

        // 保存组合信息供键盘显示
        let comboInfo: [String: Any] = [
            "name": combination.name,
            "icon": combination.icon,
            "colorHex": combination.colorHex,
            "tagCount": combination.tagIDs.count
        ]
        UserDefaults.shared.set(comboInfo, forKey: "current_tag_combination_info")
    }
}