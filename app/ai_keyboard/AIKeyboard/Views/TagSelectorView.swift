import SwiftUI

/// 标签选择器 - 网格布局选择风格标签
struct TagSelectorView: View {
    @EnvironmentObject var tagManager: TagManager
    @EnvironmentObject var subscriptionManager: SubscriptionManager

    let onSelectionChanged: ([UUID]) -> Void

    @State private var selectedTagIDs: Set<UUID> = []
    @State private var searchText = ""

    var body: some View {
        VStack(spacing: 0) {
            // 搜索栏
            if !tagManager.tags.isEmpty {
                SearchBar(text: $searchText, placeholder: "搜索标签...")
                    .padding(.horizontal)
                    .padding(.vertical, 8)
            }

            // 选中的标签预览
            if !selectedTagIDs.isEmpty {
                selectedTagsPreview
                    .padding(.horizontal)
                    .padding(.vertical, 8)
            }

            // 标签网格
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(displayCategories, id: \.self) { category in
                        if let tags = filteredTagsByCategory[category], !tags.isEmpty {
                            categorySection(category: category, tags: tags)
                        }
                    }
                }
                .padding()
            }
        }
        .navigationTitle("选择标签")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("完成") {
                    onSelectionChanged(Array(selectedTagIDs))
                }
                .disabled(selectedTagIDs.isEmpty)
            }
        }
    }

    // MARK: - 计算属性

    private var filteredTags: [StyleTag] {
        if searchText.isEmpty {
            return tagManager.tags.filter { $0.isEnabled }
        } else {
            return tagManager.tags.filter { tag in
                tag.isEnabled && (
                    tag.name.localizedCaseInsensitiveContains(searchText) ||
                    tag.description.localizedCaseInsensitiveContains(searchText) ||
                    tag.category.displayName.localizedCaseInsensitiveContains(searchText)
                )
            }
        }
    }

    private var filteredTagsByCategory: [StyleTag.TagCategory: [StyleTag]] {
        var grouped: [StyleTag.TagCategory: [StyleTag]] = [:]
        for tag in filteredTags {
            grouped[tag.category, default: []].append(tag)
        }
        return grouped
    }

    private var displayCategories: [StyleTag.TagCategory] {
        StyleTag.TagCategory.allCases.filter { filteredTagsByCategory[$0] != nil }
    }

    // MARK: - 子视图

    private var selectedTagsPreview: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("已选择 (\(selectedTagIDs.count))")
                .font(.caption)
                .foregroundStyle(.secondary)

            FlowLayout(spacing: 8) {
                ForEach(Array(selectedTagIDs), id: \.self) { tagID in
                    if let tag = tagManager.tags.first(where: { $0.id == tagID }) {
                        SelectedTagChip(tag: tag) {
                            selectedTagIDs.remove(tagID)
                        }
                    }
                }
            }
        }
    }

    private func categorySection(category: StyleTag.TagCategory, tags: [StyleTag]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // 分类标题
            HStack {
                Image(systemName: category.icon)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text(category.displayName)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Spacer()

                Text("\(tags.count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            // 标签网格
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(tags) { tag in
                    TagCard(
                        tag: tag,
                        isSelected: selectedTagIDs.contains(tag.id),
                        onTap: { toggleTagSelection(tag) }
                    )
                }
            }
        }
    }

    // MARK: - 交互

    private func toggleTagSelection(_ tag: StyleTag) {
        // 免费用户只能选择内置标签
        if !subscriptionManager.isPro && !tag.isBuiltIn {
            // 可以在这里显示订阅提示
            return
        }

        if selectedTagIDs.contains(tag.id) {
            selectedTagIDs.remove(tag.id)
        } else {
            selectedTagIDs.insert(tag.id)
        }
    }
}

// MARK: - 标签卡片

struct TagCard: View {
    let tag: StyleTag
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // 图标
                HStack {
                    Image(systemName: tag.icon)
                        .font(.caption)
                        .foregroundStyle(isSelected ? .white : .secondary)

                    Spacer()

                    if tag.isBuiltIn {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption2)
                            .foregroundStyle(isSelected ? .white : .green)
                    }
                }

                // 名称
                Text(tag.name)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(isSelected ? .white : .primary)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // 描述
                Text(tag.description)
                    .font(.caption2)
                    .foregroundStyle(isSelected ? .white.opacity(0.8) : .secondary)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(12)
            .frame(minHeight: 100)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.accentColor : Color(.secondarySystemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 选中标签芯片

struct SelectedTagChip: View {
    let tag: StyleTag
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: tag.icon)
                .font(.caption2)

            Text(tag.name)
                .font(.caption)

            Button(action: onRemove) {
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

// MARK: - 流式布局

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if x + size.width > width, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }

            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }

        height = y + rowHeight

        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let width = bounds.width
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if x + size.width > width, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }

            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))

            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

// MARK: - 搜索栏

struct SearchBar: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)

            TextField(placeholder, text: $text)
                .textFieldStyle(.plain)

            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .background(Color(.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

#Preview {
    NavigationStack {
        TagSelectorView { _ in }
            .environmentObject(TagManager.shared)
            .environmentObject(SubscriptionManager())
    }
}