import SwiftUI

/// 风格列表页面 - 管理和选择说话风格
struct StyleListView: View {
    @EnvironmentObject var styleManager: StyleManager
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    
    @State private var showingEditor = false
    @State private var editingStyle: SpeakingStyle?
    @State private var showingSubscription = false
    
    var body: some View {
        NavigationStack {
            List {
                // MARK: - 当前选中风格
                if !styleManager.selectedStyleIDs.isEmpty {
                    Section {
                        selectedStylesPreview
                    } header: {
                        Text("当前风格")
                    }
                }
                
                // MARK: - 内置风格
                Section {
                    ForEach(builtInStyles) { style in
                        StyleRowView(
                            style: style,
                            isSelected: styleManager.selectedStyleIDs.contains(style.id),
                            onTap: { toggleStyle(style) }
                        )
                    }
                } header: {
                    Text("内置风格")
                } footer: {
                    Text("点击选择风格，可多选进行组合")
                }
                
                // MARK: - 自定义风格
                Section {
                    ForEach(customStyles) { style in
                        StyleRowView(
                            style: style,
                            isSelected: styleManager.selectedStyleIDs.contains(style.id),
                            onTap: { toggleStyle(style) }
                        )
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                styleManager.deleteStyle(style)
                            } label: {
                                Label("删除", systemImage: "trash")
                            }
                            
                            Button {
                                editingStyle = style
                            } label: {
                                Label("编辑", systemImage: "pencil")
                            }
                            .tint(.orange)
                        }
                    }
                    
                    // 添加自定义风格按钮
                    Button {
                        if canAddCustomStyle {
                            showingEditor = true
                        } else {
                            showingSubscription = true
                        }
                    } label: {
                        Label("添加自定义风格", systemImage: "plus.circle.fill")
                            .foregroundStyle(Color.appPrimary)
                    }
                } header: {
                    HStack {
                        Text("自定义风格")
                        Spacer()
                        if !subscriptionManager.isPro {
                            Text("\(styleManager.customStyleCount)/\(AppConstants.freeCustomStyleCount)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                
                // MARK: - 风格组合
                if !styleManager.combinations.isEmpty {
                    Section {
                        ForEach(styleManager.combinations) { combo in
                            CombinationRowView(combination: combo, styles: styleManager.styles)
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) {
                                        styleManager.deleteCombination(combo)
                                    } label: {
                                        Label("删除", systemImage: "trash")
                                    }
                                }
                        }
                    } header: {
                        Text("我的风格组合")
                    }
                }
            }
            .navigationTitle("说话风格")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if !subscriptionManager.isPro {
                        Button {
                            showingSubscription = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "crown.fill")
                                Text("Pro")
                            }
                            .font(.subheadline.bold())
                            .foregroundStyle(Color.proGold)
                        }
                    }
                }
            }
            .sheet(isPresented: $showingEditor) {
                StyleEditorView(style: nil) { newStyle in
                    styleManager.addStyle(newStyle)
                }
            }
            .sheet(item: $editingStyle) { style in
                StyleEditorView(style: style) { updatedStyle in
                    styleManager.updateStyle(updatedStyle)
                }
            }
            .sheet(isPresented: $showingSubscription) {
                SubscriptionView()
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var builtInStyles: [SpeakingStyle] {
        styleManager.styles.filter { $0.isBuiltIn }
    }
    
    private var customStyles: [SpeakingStyle] {
        styleManager.styles.filter { !$0.isBuiltIn }
    }
    
    private var canAddCustomStyle: Bool {
        subscriptionManager.isPro || styleManager.customStyleCount < AppConstants.freeCustomStyleCount
    }
    
    // MARK: - Actions
    
    private func toggleStyle(_ style: SpeakingStyle) {
        // 免费用户只能选择有限的内置风格
        if !subscriptionManager.isPro && !style.isBuiltIn {
            showingSubscription = true
            return
        }
        
        styleManager.toggleStyleSelection(style.id)
    }
    
    private var selectedStylesPreview: some View {
        let selectedStyles = styleManager.styles.filter { styleManager.selectedStyleIDs.contains($0.id) }
        return HStack(spacing: 8) {
            ForEach(selectedStyles) { style in
                HStack(spacing: 4) {
                    Image(systemName: style.icon)
                        .font(.caption)
                    Text(style.name)
                        .font(.caption)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(style.color.opacity(0.15))
                .foregroundStyle(style.color)
                .clipShape(Capsule())
            }
        }
    }
}

// MARK: - 风格行视图

struct StyleRowView: View {
    let style: SpeakingStyle
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // 图标
                Image(systemName: style.icon)
                    .font(.title3)
                    .foregroundStyle(style.color)
                    .frame(width: 36, height: 36)
                    .background(style.color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                
                // 名称和描述
                VStack(alignment: .leading, spacing: 2) {
                    Text(style.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)
                    Text(style.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // 选中指示器
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? style.color : .secondary.opacity(0.3))
                    .font(.title3)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 组合行视图

struct CombinationRowView: View {
    let combination: StyleCombination
    let styles: [SpeakingStyle]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(combination.name)
                .font(.body.weight(.medium))
            
            HStack(spacing: 6) {
                let matchedStyles = combination.styleIDs.compactMap { id in
                    styles.first(where: { $0.id == id })
                }
                ForEach(matchedStyles) { style in
                    Text(style.name)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(style.color.opacity(0.12))
                        .foregroundStyle(style.color)
                        .clipShape(Capsule())
                }
            }
        }
    }
}

#Preview {
    StyleListView()
        .environmentObject(StyleManager())
        .environmentObject(SubscriptionManager())
}
