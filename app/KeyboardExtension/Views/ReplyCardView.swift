import SwiftUI

/// 回复候选卡片视图
struct ReplyCardView: View {
    let text: String
    let onSelect: () -> Void
    
    @State private var isCopied = false
    
    var body: some View {
        Button(action: {
            onSelect()
            withAnimation(.easeInOut(duration: 0.3)) {
                isCopied = true
            }
        }) {
            HStack(alignment: .top, spacing: 10) {
                Text(text)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(4)
                
                Spacer(minLength: 8)
                
                Image(systemName: isCopied ? "checkmark.circle.fill" : "arrow.up.circle.fill")
                    .font(.title3)
                    .foregroundStyle(isCopied ? Color.green : Color.appPrimary)
            }
            .padding(12)
            .background(Color(.tertiarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    VStack(spacing: 8) {
        ReplyCardView(text: "哈哈，你说的太有意思了！下次我们一起去试试呗~") {}
        ReplyCardView(text: "好的，我了解了。我会尽快处理这个问题，稍后给您回复。") {}
    }
    .padding()
}
