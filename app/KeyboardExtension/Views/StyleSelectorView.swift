import SwiftUI

/// 键盘底栏风格指示器
struct StyleSelectorView: View {
    let selectedNames: [String]
    
    var body: some View {
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
}

#Preview {
    VStack(spacing: 12) {
        StyleSelectorView(selectedNames: [])
        StyleSelectorView(selectedNames: ["幽默"])
        StyleSelectorView(selectedNames: ["幽默", "温柔"])
    }
}
