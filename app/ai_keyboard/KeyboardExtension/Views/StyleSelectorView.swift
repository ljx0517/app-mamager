import SwiftUI

/// 键盘底栏风格指示器 - 可点击以打开风格选择器
struct StyleSelectorView: View {
    let selectedNames: [String]
    @State private var showingStylePicker = false

    var body: some View {
        Button {
            showingStylePicker = true
        } label: {
            if selectedNames.isEmpty {
                Label("默认风格", systemImage: "paintpalette")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                HStack(spacing: 4) {
                    Image(systemName: "paintpalette.fill")
                        .font(.caption2)
                        .foregroundStyle(Color.appPrimary)

                    Text(selectedNames.joined(separator: " + "))
                        .font(.caption2)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Color.appPrimary.opacity(0.1))
                .clipShape(Capsule())
            }
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showingStylePicker) {
            KeyboardStylePickerView()
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("KeyboardStyleChanged"))) { _ in
            // 当风格变化时，可以在这里更新显示
            // 实际更新由KeyboardMainView的loadStylePrompt处理
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        StyleSelectorView(selectedNames: [])
        StyleSelectorView(selectedNames: ["幽默"])
        StyleSelectorView(selectedNames: ["幽默", "温柔"])
    }
}
