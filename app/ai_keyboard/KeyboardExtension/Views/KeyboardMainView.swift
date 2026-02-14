import SwiftUI

/// 键盘主视图 - SwiftUI 实现
struct KeyboardMainView: View {
    @ObservedObject var clipboardHelper: KeyboardClipboardHelper
    let subscriptionStatus: SubscriptionStatus
    let onInsertText: (String) -> Void
    let onDeleteBackward: () -> Void
    let onSwitchKeyboard: () -> Void
    
    @State private var replies: [String] = []
    @State private var isGenerating = false
    @State private var selectedStyleNames: [String] = []
    @State private var errorMessage: String?
    @State private var showUpgradePrompt = false
    @State private var usageInfo: (used: Int, remaining: Int, limit: Int, isPro: Bool) = (0, 10, 10, false)
    
    var body: some View {
        VStack(spacing: 0) {
            // MARK: - 顶栏：剪贴板内容展示
            clipboardBar
            
            // MARK: - 中间：回复候选区域
            repliesArea
            
            // MARK: - 底栏：操作按钮
            toolBar
        }
        .background(Color(.systemBackground))
        // 视图出现时更新使用信息
        .onAppear {
            updateUsageInfo()
        }
        // 监听剪贴板内容变化，自动清除旧回复
        .onChange(of: clipboardHelper.clipboardText) { _ in
            if clipboardHelper.contentDidChange {
                AppLogger.clipboard.info("📋 [Keyboard] 剪贴板内容已更新，清除旧回复")
                replies = []
                errorMessage = nil
                clipboardHelper.acknowledgeChange()
            }
        }
        // 监听风格变化通知
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("KeyboardStyleChanged"))) { _ in
            AppLogger.keyboard.info("🎨 [Keyboard] 收到风格变化通知，刷新风格显示")
            // 重新加载风格以更新显示
            _ = loadStylePrompt() // 调用loadStylePrompt会更新selectedStyleNames
        }
        // 显示升级提示
        .sheet(isPresented: $showUpgradePrompt) {
            UpgradeProView(
                usedCount: usageInfo.used,
                limit: usageInfo.limit,
                onDismiss: { showUpgradePrompt = false }
            )
        }
    }
    
    // MARK: - 剪贴板内容栏
    
    private var clipboardBar: some View {
        Group {
            if let text = clipboardHelper.clipboardText {
                HStack(spacing: 8) {
                    Image(systemName: "doc.on.clipboard")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text(text.clipboardPreview)
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    Button {
                        generateReply()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "sparkles")
                            Text("生成回复")
                        }
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.appPrimary)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))
            }
        }
    }
    
    // MARK: - 回复候选区域
    
    private var repliesArea: some View {
        Group {
            if isGenerating {
                HStack {
                    Spacer()
                    ProgressView()
                        .padding()
                    Text("AI 正在思考...")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .frame(height: 160)
            } else if !replies.isEmpty {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(replies, id: \.self) { reply in
                            ReplyCardView(text: reply) {
                                onInsertText(reply)
                                replies = []
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                }
                .frame(height: 160)
            } else if let error = errorMessage {
                VStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.title3)
                        .foregroundStyle(.orange)
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(height: 160)
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "text.bubble")
                        .font(.title2)
                        .foregroundStyle(.secondary.opacity(0.5))

                    Text("复制对方的消息，即可生成智能回复")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    // 免费用户显示使用计数
                    if !subscriptionStatus.isPro {
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text("今日剩余: \(usageInfo.remaining)/\(usageInfo.limit)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .monospacedDigit()
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(Capsule())
                    }
                }
                .frame(height: 160)
            }
        }
    }
    
    // MARK: - 底部工具栏
    
    private var toolBar: some View {
        HStack(spacing: 16) {
            // 切换键盘
            Button(action: onSwitchKeyboard) {
                Image(systemName: "globe")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // 风格指示器
            StyleSelectorView(selectedNames: selectedStyleNames)
            
            Spacer()
            
            // 退格键
            Button(action: onDeleteBackward) {
                Image(systemName: "delete.left")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            
            // 换行键
            Button {
                onInsertText("\n")
            } label: {
                Image(systemName: "return")
                    .font(.title3)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.appPrimary)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemBackground))
    }
    
    // MARK: - 生成回复
    
    /// 生成回复 — 始终从 clipboardHelper 获取最新剪贴板内容
    private func generateReply() {
        // 实时读取最新剪贴板内容，确保不会用到过期数据
        clipboardHelper.checkClipboard()

        guard let message = clipboardHelper.clipboardText, !message.isBlank else {
            AppLogger.keyboard.warning("⚠️ [Keyboard] 剪贴板为空，无法生成回复")
            errorMessage = "剪贴板中没有文本内容"
            return
        }

        // 检查权限：每日使用限制
        let usageCheck = DailyUsageManager.shared.canGenerateReply(subscriptionStatus: subscriptionStatus)
        if !usageCheck.canGenerate {
            usageInfo = DailyUsageManager.shared.getUsageInfo(subscriptionStatus: subscriptionStatus)
            showUpgradePrompt = true
            AppLogger.keyboard.warning("⛔ [Keyboard] 免费用户每日限制已达上限: \(usageInfo.used)/\(usageInfo.limit)")
            return
        }

        isGenerating = true
        errorMessage = nil
        replies = []

        // 从 App Group 读取风格配置
        let stylePrompt = loadStylePrompt()
        let isPro = subscriptionStatus.isPro
        let candidateCount = isPro ? AppConstants.proCandidateCount : AppConstants.freeCandidateCount

        AppLogger.keyboard.info("🚀 [Keyboard] 用户触发生成回复")
        AppLogger.keyboard.info("🚀 [Keyboard] 剪贴板消息（最新）: \(message.truncated(to: 50))")
        AppLogger.keyboard.info("🚀 [Keyboard] 选中风格: \(selectedStyleNames.joined(separator: " + "))")
        AppLogger.keyboard.info("🚀 [Keyboard] 订阅状态: \(isPro ? "Pro" : "免费"), 候选数: \(candidateCount)")
        AppLogger.keyboard.info("🚀 [Keyboard] 剩余次数: \(usageCheck.remainingCount)/\(usageCheck.limit)")

        Task {
            do {
                let response = try await KeyboardAIService.generateReply(
                    message: message,
                    stylePrompt: stylePrompt,
                    candidateCount: candidateCount
                )
                await MainActor.run {
                    // 记录使用次数
                    DailyUsageManager.shared.recordReplyUsage(subscriptionStatus: subscriptionStatus)

                    replies = response.replies
                    isGenerating = false
                    AppLogger.keyboard.info("🎉 [Keyboard] 回复已展示，共 \(response.replies.count) 条")
                }
            } catch {
                await MainActor.run {
                    // 仅在成功生成回复时才记录使用次数
                    // 如果生成失败，不扣除免费用户的次数
                    errorMessage = error.localizedDescription
                    isGenerating = false
                    AppLogger.keyboard.error("💥 [Keyboard] 生成失败: \(error.localizedDescription)")
                }
            }
        }
    }
    
    /// 从 App Group 读取当前风格 Prompt
    private func loadStylePrompt() -> String {
        // 优先读取标签组合的 prompt
        if let tagCombinationPrompt = UserDefaults.shared.string(forKey: "current_tag_combination_prompt"),
           !tagCombinationPrompt.isEmpty {
            // 读取组合信息用于显示
            if let comboInfo = UserDefaults.shared.dictionary(forKey: "current_tag_combination_info") as? [String: Any] {
                let name = comboInfo["name"] as? String ?? "标签组合"
                selectedStyleNames = [name]
            } else {
                selectedStyleNames = ["标签组合"]
            }
            return tagCombinationPrompt
        }

        // 回退到原来的风格选择逻辑
        guard let ids = UserDefaults.shared.stringArray(forKey: AppConstants.UserDefaultsKey.selectedStyleIDs),
              !ids.isEmpty else {
            return "请用自然、友好的语气回复。"
        }

        // 读取保存的风格数据
        if let data = UserDefaults.shared.data(forKey: "saved_styles"),
           let styles = try? JSONDecoder().decode([SpeakingStyle].self, from: data) {
            let allStyles = SpeakingStyle.builtInStyles + styles
            let selectedStyles = allStyles.filter { ids.contains($0.id.uuidString) }
            selectedStyleNames = selectedStyles.map { $0.name }

            if selectedStyles.count == 1, let style = selectedStyles.first {
                return style.prompt
            }

            let prompts = selectedStyles.map { "- \($0.name): \($0.prompt)" }.joined(separator: "\n")
            return "请融合以下风格来回复：\n\(prompts)"
        }

        return "请用自然、友好的语气回复。"
    }

    /// 获取当前使用信息并更新状态
    private func updateUsageInfo() {
        usageInfo = DailyUsageManager.shared.getUsageInfo(subscriptionStatus: subscriptionStatus)
    }
}
