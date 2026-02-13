import SwiftUI

/// 标签组合列表页面 - 管理和选择标签组合
struct TagCombinationListView: View {
    @EnvironmentObject var tagManager: TagManager
    @EnvironmentObject var subscriptionManager: SubscriptionManager

    @State private var showingEditor = false
    @State private var editingCombination: TagCombination?
    @State private var showingSubscription = false

    var body: some View {
        NavigationStack {
            List {
                // MARK: - 当前选中组合
                if let currentCombination = tagManager.currentCombination {
                    Section {
                        currentCombinationCard
                    } header: {
                        Text("当前风格")
                    }
                }

                // MARK: - 默认组合
                if let defaultCombination = tagManager.defaultCombination,
                   defaultCombination.id != tagManager.currentCombination?.id {
                    Section {
                        combinationRow(combination: defaultCombination, isDefault: true)
                    } header: {
                        Text("默认风格")
                    }
                }

                // MARK: - 所有组合
                Section {
                    if tagManager.combinations.isEmpty {
                        emptyStateView
                    } else {
                        ForEach(tagManager.combinations) { combination in
                            combinationRow(combination: combination, isDefault: combination.id == tagManager.defaultCombination?.id)
                        }
                    }
                } header: {
                    HStack {
                        Text("所有风格组合")
                        Spacer()
                        if !subscriptionManager.isPro {
                            Text("\(tagManager.combinations.count)/\(AppConstants.freeCustomStyleCount)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } footer: {
                    if !subscriptionManager.isPro {
                        Text("免费版最多创建 \(AppConstants.freeCustomStyleCount) 个组合")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("标签组合")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if canAddCombination {
                        Button {
                            showingEditor = true
                        } label: {
                            Image(systemName: "plus")
                                .font(.body.bold())
                        }
                    }
                }
            }
            .sheet(isPresented: $showingEditor) {
                TagCombinationEditorView(combination: nil) { newCombination in
                    tagManager.addCombination(newCombination)
                    if newCombination.isDefault {
                        tagManager.setDefaultCombination(newCombination)
                    }
                }
                .environmentObject(tagManager)
                .environmentObject(subscriptionManager)
            }
            .sheet(item: $editingCombination) { combination in
                TagCombinationEditorView(combination: combination) { updatedCombination in
                    tagManager.updateCombination(updatedCombination)
                    if updatedCombination.isDefault {
                        tagManager.setDefaultCombination(updatedCombination)
                    }
                }
                .environmentObject(tagManager)
                .environmentObject(subscriptionManager)
            }
            .sheet(isPresented: $showingSubscription) {
                SubscriptionView()
            }
            .onAppear {
                // 确保默认组合已设置
                if tagManager.defaultCombination == nil && !tagManager.combinations.isEmpty {
                    tagManager.setDefaultCombination(tagManager.combinations.first!)
                }
            }
        }
    }

    // MARK: - 计算属性

    private var canAddCombination: Bool {
        subscriptionManager.isPro || tagManager.combinations.count < AppConstants.freeCustomStyleCount
    }

    // MARK: - 子视图

    private var currentCombinationCard: some View {
        if let combination = tagManager.currentCombination {
            return AnyView(
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: combination.icon)
                            .font(.title3)
                            .foregroundStyle(Color(hex: combination.colorHex) ?? .blue)
                            .frame(width: 40, height: 40)
                            .background(Color(hex: combination.colorHex)?.opacity(0.15) ?? Color.blue.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 4) {
                                Text(combination.name)
                                    .font(.headline)
                                if combination.isDefault {
                                    Image(systemName: "checkmark.seal.fill")
                                        .font(.caption)
                                        .foregroundStyle(.green)
                                }
                            }
                            Text(combination.description)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        // 当前使用指示器
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Color(hex: combination.colorHex) ?? .blue)
                    }

                    // 标签预览
                    if !combination.tagIDs.isEmpty {
                        tagChips(for: combination)
                    }

                    // 操作按钮
                    HStack(spacing: 12) {
                        Button {
                            tagManager.selectCombination(nil) // 取消选择
                        } label: {
                            Text("取消选择")
                                .font(.caption.bold())
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(.tertiarySystemBackground))
                                .foregroundStyle(.secondary)
                                .clipShape(Capsule())
                        }

                        if combination.id != tagManager.defaultCombination?.id {
                            Button {
                                tagManager.setDefaultCombination(combination)
                            } label: {
                                Text("设为默认")
                                    .font(.caption.bold())
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.accentColor)
                                    .foregroundStyle(.white)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
                .padding(.vertical, 8)
            )
        } else {
            return AnyView(EmptyView())
        }
    }

    private func combinationRow(combination: TagCombination, isDefault: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: combination.icon)
                    .font(.title2)
                    .foregroundStyle(Color(hex: combination.colorHex) ?? .blue)
                    .frame(width: 36, height: 36)
                    .background(Color(hex: combination.colorHex)?.opacity(0.12) ?? Color.blue.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(combination.name)
                            .font(.body.weight(.medium))
                        if isDefault {
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

                    Text(combination.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                // 选中指示器
                if tagManager.selectedCombinationID == combination.id {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Color(hex: combination.colorHex) ?? .blue)
                } else {
                    Image(systemName: "circle")
                        .font(.title3)
                        .foregroundStyle(.secondary.opacity(0.3))
                }
            }

            // 标签预览
            if !combination.tagIDs.isEmpty {
                tagChips(for: combination)
            }

            // 操作按钮
            HStack(spacing: 8) {
                Button {
                    tagManager.selectCombination(combination)
                } label: {
                    Text("使用此风格")
                        .font(.caption2.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }

                if !isDefault {
                    Button {
                        tagManager.setDefaultCombination(combination)
                    } label: {
                        Text("设为默认")
                            .font(.caption2.bold())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color(.tertiarySystemBackground))
                            .foregroundStyle(.secondary)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture {
            tagManager.selectCombination(combination)
        }
        .swipeActions(edge: .trailing) {
            if !combination.isBuiltIn {
                Button(role: .destructive) {
                    tagManager.deleteCombination(combination)
                } label: {
                    Label("删除", systemImage: "trash")
                }

                Button {
                    editingCombination = combination
                } label: {
                    Label("编辑", systemImage: "pencil")
                }
                .tint(.orange)
            }
        }
    }

    private func tagChips(for combination: TagCombination) -> some View {
        FlowLayout(spacing: 6) {
            ForEach(combination.tagIDs.prefix(5), id: \.self) { tagID in
                if let tag = tagManager.tags.first(where: { $0.id == tagID }) {
                    Text(tag.name)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color(hex: combination.colorHex)?.opacity(0.12) ?? Color.accentColor.opacity(0.12))
                        .foregroundStyle(Color(hex: combination.colorHex) ?? .accentColor)
                        .clipShape(Capsule())
                }
            }

            if combination.tagIDs.count > 5 {
                Text("+\(combination.tagIDs.count - 5)")
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color(.tertiarySystemBackground))
                    .foregroundStyle(.secondary)
                    .clipShape(Capsule())
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "square.stack")
                .font(.largeTitle)
                .foregroundStyle(.secondary.opacity(0.5))

            VStack(spacing: 4) {
                Text("暂无风格组合")
                    .font(.headline)

                Text("创建一个标签组合来定义你的专属说话风格")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                if canAddCombination {
                    showingEditor = true
                } else {
                    showingSubscription = true
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                    Text("创建第一个组合")
                }
                .font(.subheadline.bold())
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }
}

#Preview {
    TagCombinationListView()
        .environmentObject(TagManager.shared)
        .environmentObject(SubscriptionManager())
}