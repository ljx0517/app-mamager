import SwiftUI

/// 升级 Pro 提示视图
struct UpgradeProView: View {
    let usedCount: Int
    let limit: Int
    let onDismiss: () -> Void

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // 图标
                Image(systemName: "crown.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(.yellow)
                    .padding(.top, 40)

                // 标题
                VStack(spacing: 8) {
                    Text("今日免费次数已用完")
                        .font(.title2.bold())
                        .foregroundStyle(.primary)

                    Text("\(usedCount)/\(limit)")
                        .font(.title3.monospacedDigit())
                        .foregroundStyle(.secondary)
                }

                // 功能对比
                VStack(alignment: .leading, spacing: 16) {
                    FeatureRow(
                        icon: "infinity",
                        title: "无限回复",
                        description: "Pro 用户无每日次数限制",
                        isPro: true
                    )

                    FeatureRow(
                        icon: "sparkles",
                        title: "更多候选回复",
                        description: "每次生成 5 条候选回复（免费版仅 1 条）",
                        isPro: true
                    )

                    FeatureRow(
                        icon: "paintpalette",
                        title: "更多说话风格",
                        description: "解锁所有内置风格和自定义风格",
                        isPro: true
                    )

                    FeatureRow(
                        icon: "bolt",
                        title: "优先处理",
                        description: "AI 回复生成优先队列",
                        isPro: true
                    )
                }
                .padding(.horizontal, 24)

                Spacer()

                // 操作按钮
                VStack(spacing: 12) {
                    Button(action: {
                        // TODO: 打开主应用订阅页面
                        onDismiss()
                    }) {
                        HStack {
                            Image(systemName: "crown.fill")
                            Text("升级 Pro 版本")
                        }
                        .font(.headline.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.appPrimary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button("稍后再说") {
                        onDismiss()
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("关闭") {
                        onDismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

/// 功能对比行
private struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    let isPro: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(isPro ? Color.appPrimary : .secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.primary)

                    if isPro {
                        Text("PRO")
                            .font(.caption2.bold())
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.appPrimary.opacity(0.2))
                            .foregroundStyle(Color.appPrimary)
                            .clipShape(Capsule())
                    }
                }

                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

#Preview {
    UpgradeProView(
        usedCount: 10,
        limit: 10,
        onDismiss: {}
    )
}