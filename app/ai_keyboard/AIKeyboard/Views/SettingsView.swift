import SwiftUI

/// 设置页面
struct SettingsView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @State private var showingSubscription = false
    
    var body: some View {
        NavigationStack {
            List {
                // MARK: - 订阅状态
                Section {
                    subscriptionCard
                }
                
                // MARK: - 键盘设置
                Section("键盘") {
                    NavigationLink {
                        KeyboardSetupGuideView()
                    } label: {
                        Label("键盘设置指南", systemImage: "keyboard")
                    }
                }
                
                // MARK: - 通用设置
                Section("通用") {
                    NavigationLink {
                        // AI 模型选择页面
                        Text("AI 模型选择")
                    } label: {
                        Label("AI 模型", systemImage: "cpu")
                    }
                }
                
                // MARK: - 关于
                Section("关于") {
                    HStack {
                        Label("版本", systemImage: "info.circle")
                        Spacer()
                        Text(appVersion)
                            .foregroundStyle(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://example.com/privacy")!) {
                        Label("隐私政策", systemImage: "hand.raised.fill")
                    }
                    
                    Link(destination: URL(string: "https://example.com/terms")!) {
                        Label("使用条款", systemImage: "doc.text")
                    }
                }
            }
            .navigationTitle("设置")
            .sheet(isPresented: $showingSubscription) {
                SubscriptionView()
            }
        }
    }
    
    // MARK: - 订阅状态卡片
    
    private var subscriptionCard: some View {
        Button {
            if !subscriptionManager.isPro {
                showingSubscription = true
            }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: subscriptionManager.isPro ? "crown.fill" : "crown")
                    .font(.title2)
                    .foregroundStyle(subscriptionManager.isPro ? Color.proGold : Color.secondary)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(subscriptionManager.subscriptionStatus.tier.displayName)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    
                    if subscriptionManager.isPro {
                        if let days = subscriptionManager.subscriptionStatus.daysRemaining {
                            Text("剩余 \(days) 天")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Text("升级 Pro 解锁全部功能")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
                
                if !subscriptionManager.isPro {
                    Text("升级")
                        .font(.subheadline.bold())
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(
                            LinearGradient(
                                colors: [.orange, .yellow],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
    
    private var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }
}

// MARK: - 键盘设置引导页

struct KeyboardSetupGuideView: View {
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    guideStep(number: 1, text: "打开「设置」→「通用」→「键盘」")
                    guideStep(number: 2, text: "点击「键盘」→「添加新键盘」")
                    guideStep(number: 3, text: "选择「AI Keyboard」")
                    guideStep(number: 4, text: "点击「AI Keyboard」→ 开启「允许完全访问」")
                }
                .padding(.vertical, 8)
            } header: {
                Text("设置步骤")
            } footer: {
                Text("需要「完全访问」权限才能读取剪贴板内容并与服务器通信。我们不会收集您的个人数据。")
            }
            
            Section {
                Button("打开系统设置") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
            }
        }
        .navigationTitle("键盘设置")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func guideStep(number: Int, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .foregroundStyle(.white)
                .frame(width: 24, height: 24)
                .background(Color.appPrimary)
                .clipShape(Circle())
            
            Text(text)
                .font(.body)
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(SubscriptionManager())
}
