import SwiftUI

/// 标签组合编辑器 - 创建或编辑标签组合
struct TagCombinationEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var tagManager: TagManager
    @EnvironmentObject var subscriptionManager: SubscriptionManager

    let combination: TagCombination?
    let onSave: (TagCombination) -> Void

    @State private var name: String = ""
    @State private var description: String = ""
    @State private var selectedTagIDs: Set<UUID> = []
    @State private var weights: [UUID: Double] = [:]
    @State private var isDefault: Bool = false
    @State private var icon: String = "square.stack.fill"
    @State private var colorHex: String = "#007AFF"
    @State private var showingTagSelector = false
    @State private var previewPrompt: String = ""

    /// 可选图标列表
    private let iconOptions = [
        "square.stack.fill", "sparkles", "wand.and.stars", "paintpalette.fill",
        "face.smiling.fill", "heart.fill", "briefcase.fill", "book.fill",
        "message.fill", "bubble.left.fill", "star.fill", "crown.fill"
    ]

    /// 可选颜色列表
    private let colorOptions = [
        "#007AFF", "#FF2D55", "#FF9500", "#34C759",
        "#AF52DE", "#FF3B30", "#5856D6", "#00C7BE",
        "#5AC8FA", "#FFCC00", "#8E8E93", "#32D74B"
    ]

    var isEditing: Bool { combination != nil }

    var body: some View {
        NavigationStack {
            Form {
                // MARK: - 基本信息
                Section("基本信息") {
                    TextField("组合名称", text: $name)
                    TextField("简短描述", text: $description)
                }

                // MARK: - 外观设置
                Section("图标与颜色") {
                    // 图标选择
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(iconOptions, id: \.self) { iconName in
                                Image(systemName: iconName)
                                    .font(.title3)
                                    .frame(width: 40, height: 40)
                                    .background(icon == iconName ? Color(hex: colorHex)?.opacity(0.15) ?? Color.blue.opacity(0.15) : Color.clear)
                                    .foregroundStyle(icon == iconName ? Color(hex: colorHex) ?? .blue : .secondary)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(icon == iconName ? Color(hex: colorHex) ?? .blue : .clear, lineWidth: 2)
                                    )
                                    .onTapGesture { icon = iconName }
                            }
                        }
                        .padding(.vertical, 4)
                    }

                    // 颜色选择
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(colorOptions, id: \.self) { hex in
                                Circle()
                                    .fill(Color(hex: hex) ?? .blue)
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Circle()
                                            .stroke(.white, lineWidth: colorHex == hex ? 3 : 0)
                                    )
                                    .shadow(color: colorHex == hex ? (Color(hex: hex) ?? .blue).opacity(0.4) : .clear, radius: 4)
                                    .onTapGesture { colorHex = hex }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // MARK: - 标签选择
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        // 选择标签按钮
                        Button {
                            showingTagSelector = true
                        } label: {
                            HStack {
                                Image(systemName: "tag.fill")
                                Text("选择标签")
                                Spacer()
                                Text("\(selectedTagIDs.count) 个标签")
                                    .foregroundStyle(.secondary)
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        // 选中的标签预览
                        if !selectedTagIDs.isEmpty {
                            selectedTagsPreview
                        }
                    }
                } header: {
                    Text("风格标签")
                } footer: {
                    Text("选择至少 1 个标签来定义组合风格")
                }

                // MARK: - 标签权重
                if !selectedTagIDs.isEmpty {
                    Section("标签权重") {
                        ForEach(Array(selectedTagIDs), id: \.self) { tagID in
                            if let tag = tagManager.tags.first(where: { $0.id == tagID }) {
                                weightSlider(for: tag)
                            }
                        }
                    }
                }

                // MARK: - 默认设置
                Section {
                    Toggle("设为默认风格", isOn: $isDefault)
                        .disabled(isEditing && combination?.isDefault == true)
                } footer: {
                    if isEditing && combination?.isDefault == true {
                        Text("当前组合已是默认风格")
                            .foregroundStyle(.secondary)
                    } else if isDefault {
                        Text("设置为默认后，键盘将自动使用此风格")
                            .foregroundStyle(.secondary)
                    }
                }

                // MARK: - 预览
                if !selectedTagIDs.isEmpty {
                    Section("预览") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("生成的 Prompt")
                                .font(.caption)
                                .foregroundStyle(.secondary)

                            Text(previewPrompt)
                                .font(.caption)
                                .foregroundStyle(.primary)
                                .lineLimit(6)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(10)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .onTapGesture {
                                    // 点击可以查看完整内容
                                    // 可以添加展开功能
                                }
                        }
                        .onAppear { updatePreview() }
                        .onChange(of: selectedTagIDs) { _ in updatePreview() }
                        .onChange(of: weights) { _ in updatePreview() }
                    }
                }
            }
            .navigationTitle(isEditing ? "编辑组合" : "新建组合")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") { saveCombination() }
                        .disabled(name.isBlank || selectedTagIDs.isEmpty)
                }
            }
            .sheet(isPresented: $showingTagSelector) {
                NavigationStack {
                    TagSelectorView { selectedIDs in
                        selectedTagIDs = Set(selectedIDs)
                        showingTagSelector = false
                        updateWeightsForNewTags()
                    }
                    .environmentObject(tagManager)
                    .environmentObject(subscriptionManager)
                }
            }
            .onAppear { loadExistingCombination() }
        }
    }

    // MARK: - 子视图

    private var selectedTagsPreview: some View {
        FlowLayout(spacing: 8) {
            ForEach(Array(selectedTagIDs), id: \.self) { tagID in
                if let tag = tagManager.tags.first(where: { $0.id == tagID }) {
                    HStack(spacing: 4) {
                        Image(systemName: tag.icon)
                            .font(.caption2)
                        Text(tag.name)
                            .font(.caption)
                        Button {
                            selectedTagIDs.remove(tagID)
                            weights.removeValue(forKey: tagID)
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.caption2)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.accentColor.opacity(0.15))
                    .foregroundStyle(Color.accentColor)
                    .clipShape(Capsule())
                }
            }
        }
    }

    private func weightSlider(for tag: StyleTag) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: tag.icon)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text(tag.name)
                    .font(.caption.weight(.medium))

                Spacer()

                Text("\(Int((weights[tag.id] ?? 1.0) * 100))%")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }

            Slider(
                value: Binding(
                    get: { weights[tag.id] ?? 1.0 },
                    set: { weights[tag.id] = $0 }
                ),
                in: 0.1...2.0,
                step: 0.1
            )
        }
    }

    // MARK: - 逻辑

    private func loadExistingCombination() {
        guard let combination = combination else { return }

        name = combination.name
        description = combination.description
        selectedTagIDs = Set(combination.tagIDs)
        weights = combination.weights
        isDefault = combination.isDefault
        icon = combination.icon
        colorHex = combination.colorHex

        updatePreview()
    }

    private func updateWeightsForNewTags() {
        for tagID in selectedTagIDs {
            if weights[tagID] == nil {
                weights[tagID] = 1.0 // 默认权重
            }
        }

        // 清理已移除标签的权重
        for tagID in weights.keys {
            if !selectedTagIDs.contains(tagID) {
                weights.removeValue(forKey: tagID)
            }
        }
    }

    private func updatePreview() {
        let tempCombination = TagCombination(
            name: name.isEmpty ? "预览组合" : name,
            description: description,
            tagIDs: Array(selectedTagIDs),
            weights: weights
        )
        previewPrompt = tempCombination.combinedPrompt(tags: tagManager.tags)
    }

    private func saveCombination() {
        let savedCombination = TagCombination(
            id: combination?.id ?? UUID(),
            name: name.trimmed,
            description: description.trimmed,
            tagIDs: Array(selectedTagIDs),
            weights: weights,
            isDefault: isDefault,
            isBuiltIn: false,
            icon: icon,
            colorHex: colorHex,
            createdAt: combination?.createdAt ?? Date(),
            updatedAt: Date()
        )

        onSave(savedCombination)
        dismiss()
    }
}

#Preview {
    TagCombinationEditorView(combination: nil) { _ in }
        .environmentObject(TagManager.shared)
        .environmentObject(SubscriptionManager())
}