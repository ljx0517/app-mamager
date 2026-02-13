import SwiftUI

/// 键盘风格选择器 - 允许用户在键盘中直接切换标签组合
struct KeyboardStylePickerView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var combinations: [TagCombination] = []
    @State private var tags: [StyleTag] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    /// 当前选中的组合ID（从App Group读取）
    private var currentCombinationID: UUID? {
        guard let idString = UserDefaults.shared.string(forKey: "current_tag_combination_id"),
              let uuid = UUID(uuidString: idString) else {
            return nil
        }
        return uuid
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("加载风格...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = errorMessage {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.title2)
                            .foregroundStyle(.orange)

                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)

                        Button("重试") {
                            loadCombinations()
                        }
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                    }
                    .padding()
                } else if combinations.isEmpty {
                    emptyStateView
                } else {
                    combinationListView
                }
            }
            .navigationTitle("选择风格")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") {
                        dismiss()
                    }
                    .font(.body.bold())
                }
            }
            .onAppear {
                loadCombinations()
            }
        }
    }

    // MARK: - 组合列表视图

    private var combinationListView: some View {
        List {
            ForEach(combinations) { combination in
                Button {
                    selectCombination(combination)
                } label: {
                    combinationRow(combination: combination, isSelected: combination.id == currentCombinationID)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - 组合行视图

    private func combinationRow(combination: TagCombination, isSelected: Bool) -> some View {
        HStack(spacing: 12) {
            // 图标
            Image(systemName: combination.icon)
                .font(.title3)
                .foregroundStyle(Color(hex: combination.colorHex) ?? .accentColor)
                .frame(width: 36, height: 36)
                .background(Color(hex: combination.colorHex)?.opacity(0.15) ?? Color.accentColor.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            // 组合信息
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(combination.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)

                    if combination.isDefault {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption2)
                            .foregroundStyle(.green)
                    }

                    if combination.isBuiltIn {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption2)
                            .foregroundStyle(.blue)
                    }
                }

                if !combination.description.isEmpty {
                    Text(combination.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                // 标签数量指示
                Text("\(combination.tagIDs.count)个标签")
                    .font(.caption2)
                    .foregroundStyle(.secondary.opacity(0.7))
            }

            Spacer()

            // 选中指示器
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title3)
                    .foregroundStyle(Color(hex: combination.colorHex) ?? .accentColor)
            } else {
                Image(systemName: "circle")
                    .font(.title3)
                    .foregroundStyle(.secondary.opacity(0.3))
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }

    // MARK: - 空状态视图

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "square.stack")
                .font(.largeTitle)
                .foregroundStyle(.secondary.opacity(0.5))

            VStack(spacing: 4) {
                Text("暂无风格组合")
                    .font(.headline)

                Text("请在主应用中创建风格组合")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    // MARK: - 数据加载

    /// 从 App Group 加载标签和组合数据
    private func loadCombinations() {
        isLoading = true
        errorMessage = nil

        do {
            // 先加载标签数据
            if let tagsData = UserDefaults.shared.data(forKey: "saved_style_tags") {
                let tagsDecoder = JSONDecoder()
                tagsDecoder.dateDecodingStrategy = .iso8601
                let loadedTags = try tagsDecoder.decode([StyleTag].self, from: tagsData)
                tags = loadedTags
                AppLogger.keyboard.info("🏷️ [Keyboard] 加载了 \(tags.count) 个标签")
            } else {
                // 如果没有标签数据，使用内置标签（但内置标签可能不完整）
                tags = StyleTag.builtInTags
                AppLogger.keyboard.info("🏷️ [Keyboard] 使用内置标签，共 \(tags.count) 个")
            }

            // 从 App Group 读取组合数据
            guard let data = UserDefaults.shared.data(forKey: "saved_tag_combinations") else {
                combinations = []
                isLoading = false
                return
            }

            // 解码组合列表
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let loadedCombinations = try decoder.decode([TagCombination].self, from: data)

            // 按更新时间排序（最新的在前）
            combinations = loadedCombinations.sorted { $0.updatedAt > $1.updatedAt }

            AppLogger.keyboard.info("📦 [Keyboard] 加载了 \(combinations.count) 个风格组合")
        } catch {
            errorMessage = "加载失败: \(error.localizedDescription)"
            AppLogger.keyboard.error("💥 [Keyboard] 加载组合失败: \(error.localizedDescription)")
        }

        isLoading = false
    }

    // MARK: - 选择逻辑

    /// 选择组合并更新 App Group
    private func selectCombination(_ combination: TagCombination) {
        // 保存组合 ID 到 App Group（供键盘使用）
        UserDefaults.shared.set(combination.id.uuidString, forKey: "current_tag_combination_id")

        // 同时保存到主应用的选中键，以保持一致性
        UserDefaults.shared.set(combination.id.uuidString, forKey: "selected_tag_combination_id")

        // 保存组合信息（供显示用）
        let comboInfo: [String: Any] = [
            "name": combination.name,
            "icon": combination.icon,
            "colorHex": combination.colorHex,
            "tagCount": combination.tagIDs.count
        ]
        UserDefaults.shared.set(comboInfo, forKey: "current_tag_combination_info")

        // 生成并保存组合的完整 prompt（供生成回复用）
        let prompt = combination.combinedPrompt(tags: tags)
        UserDefaults.shared.set(prompt, forKey: "current_tag_combination_prompt")

        AppLogger.keyboard.info("🎯 [Keyboard] 选择了组合: \(combination.name)")
        AppLogger.keyboard.info("🎯 [Keyboard] 生成的prompt: \(prompt.truncated(to: 100))")

        // 发送通知让键盘主视图更新显示
        NotificationCenter.default.post(name: NSNotification.Name("KeyboardStyleChanged"), object: nil)

        // 延迟一点时间关闭选择器，让用户看到选中状态
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            dismiss()
        }
    }
}

#Preview {
    KeyboardStylePickerView()
}