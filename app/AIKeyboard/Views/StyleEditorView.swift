import SwiftUI

/// 风格编辑器 - 创建或编辑自定义说话风格
struct StyleEditorView: View {
    @Environment(\.dismiss) private var dismiss
    
    let style: SpeakingStyle?
    let onSave: (SpeakingStyle) -> Void
    
    @State private var name: String = ""
    @State private var description: String = ""
    @State private var icon: String = "star.fill"
    @State private var colorHex: String = "#007AFF"
    @State private var prompt: String = ""
    @State private var emojiFrequency: SpeakingStyle.EmojiFrequency = .medium
    @State private var toneLevel: Double = 3
    
    /// 可选图标列表
    private let iconOptions = [
        "star.fill", "heart.fill", "flame.fill", "sparkles",
        "face.smiling", "hand.wave.fill", "sun.max.fill", "moon.stars.fill",
        "music.note", "leaf.fill", "crown.fill", "wand.and.stars"
    ]
    
    /// 可选颜色列表
    private let colorOptions = [
        "#007AFF", "#FF2D55", "#FF9500", "#34C759",
        "#AF52DE", "#FF3B30", "#5856D6", "#00C7BE"
    ]
    
    var isEditing: Bool { style != nil }
    
    var body: some View {
        NavigationStack {
            Form {
                // MARK: - 基本信息
                Section("基本信息") {
                    TextField("风格名称", text: $name)
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
                
                // MARK: - 风格参数
                Section("风格参数") {
                    // 语气强度
                    VStack(alignment: .leading) {
                        HStack {
                            Text("语气强度")
                            Spacer()
                            Text("\(Int(toneLevel))")
                                .foregroundStyle(.secondary)
                        }
                        Slider(value: $toneLevel, in: 1...5, step: 1)
                    }
                    
                    // Emoji 频率
                    Picker("Emoji 使用", selection: $emojiFrequency) {
                        ForEach(SpeakingStyle.EmojiFrequency.allCases, id: \.self) { freq in
                            Text(freq.displayName).tag(freq)
                        }
                    }
                }
                
                // MARK: - 风格 Prompt
                Section {
                    TextEditor(text: $prompt)
                        .frame(minHeight: 120)
                } header: {
                    Text("风格描述 (Prompt)")
                } footer: {
                    Text("描述这种风格的语言特点，AI 会据此生成回复。例如：「请用幽默风趣的语气回复，善用俏皮话和双关语。」")
                }
                
                // MARK: - 预览
                if !name.isEmpty {
                    Section("预览") {
                        StyleRowView(
                            style: previewStyle,
                            isSelected: true,
                            onTap: {}
                        )
                    }
                }
            }
            .navigationTitle(isEditing ? "编辑风格" : "新建风格")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") { saveStyle() }
                        .disabled(name.isBlank || prompt.isBlank)
                }
            }
            .onAppear { loadExistingStyle() }
        }
    }
    
    // MARK: - Preview Style
    
    private var previewStyle: SpeakingStyle {
        SpeakingStyle(
            name: name,
            description: description,
            icon: icon,
            colorHex: colorHex,
            prompt: prompt,
            emojiFrequency: emojiFrequency,
            toneLevel: Int(toneLevel)
        )
    }
    
    // MARK: - Actions
    
    private func loadExistingStyle() {
        guard let style else { return }
        name = style.name
        description = style.description
        icon = style.icon
        colorHex = style.colorHex
        prompt = style.prompt
        emojiFrequency = style.emojiFrequency
        toneLevel = Double(style.toneLevel)
    }
    
    private func saveStyle() {
        let savedStyle = SpeakingStyle(
            id: style?.id ?? UUID(),
            name: name.trimmed,
            description: description.trimmed,
            icon: icon,
            colorHex: colorHex,
            prompt: prompt.trimmed,
            isBuiltIn: false,
            isEnabled: true,
            emojiFrequency: emojiFrequency,
            toneLevel: Int(toneLevel),
            createdAt: style?.createdAt ?? Date(),
            updatedAt: Date()
        )
        onSave(savedStyle)
        dismiss()
    }
}

#Preview {
    StyleEditorView(style: nil) { _ in }
}
