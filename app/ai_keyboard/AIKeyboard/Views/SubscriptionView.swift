import SwiftUI
import StoreKit

/// 订阅/付费墙页面
struct SubscriptionView: View {
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedProduct: Product?
    @State private var isPurchasing = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // MARK: - 头部
                    headerSection
                    
                    // MARK: - 功能对比
                    featuresSection
                    
                    // MARK: - 订阅选项
                    productsSection
                    
                    // MARK: - 购买按钮
                    purchaseButton
                    
                    // MARK: - 底部说明
                    footerSection
                }
                .padding()
            }
            .background(Color.appBackground)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .alert("购买失败", isPresented: $showError) {
                Button("确定", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    // MARK: - 头部区域
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "crown.fill")
                .font(.system(size: 48))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.yellow, .orange],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Text("升级到 Pro")
                .font(.title.bold())
            
            Text("解锁全部风格 · 无限回复 · 高级模型")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 20)
    }
    
    // MARK: - 功能对比
    
    private var featuresSection: some View {
        VStack(spacing: 0) {
            FeatureCompareRow(feature: "内置风格", freeValue: "3 种", proValue: "全部解锁")
            Divider().padding(.horizontal)
            FeatureCompareRow(feature: "自定义风格", freeValue: "1 个", proValue: "无限制")
            Divider().padding(.horizontal)
            FeatureCompareRow(feature: "风格组合", freeValue: "-", proValue: "无限制")
            Divider().padding(.horizontal)
            FeatureCompareRow(feature: "每日回复", freeValue: "10 次", proValue: "无限制")
            Divider().padding(.horizontal)
            FeatureCompareRow(feature: "候选回复", freeValue: "1 条", proValue: "5 条")
            Divider().padding(.horizontal)
            FeatureCompareRow(feature: "高级模型", freeValue: "-", proValue: "可选")
        }
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    // MARK: - 订阅商品选项
    
    private var productsSection: some View {
        VStack(spacing: 12) {
            ForEach(subscriptionManager.products, id: \.id) { product in
                ProductCardView(
                    product: product,
                    isSelected: selectedProduct?.id == product.id,
                    isYearly: product.id == SubscriptionTier.proYearly.productID
                ) {
                    selectedProduct = product
                }
            }
        }
        .onAppear {
            // 默认选择年度订阅
            if selectedProduct == nil {
                selectedProduct = subscriptionManager.products.last
            }
        }
    }
    
    // MARK: - 购买按钮
    
    private var purchaseButton: some View {
        VStack(spacing: 12) {
            Button {
                Task { await purchase() }
            } label: {
                HStack {
                    if isPurchasing {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isPurchasing ? "处理中..." : "开始免费试用")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        colors: [.orange, .yellow],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(selectedProduct == nil || isPurchasing)
            
            Text("3 天免费试用，之后自动续费，可随时取消")
                .font(.caption)
                .foregroundStyle(.secondary)
            
            // 恢复购买
            Button {
                Task { await subscriptionManager.restorePurchases() }
            } label: {
                Text("恢复购买")
                    .font(.subheadline)
                    .foregroundStyle(Color.appPrimary)
            }
        }
    }
    
    // MARK: - 底部说明
    
    private var footerSection: some View {
        VStack(spacing: 8) {
            HStack(spacing: 16) {
                Link("使用条款", destination: URL(string: "https://example.com/terms")!)
                Link("隐私政策", destination: URL(string: "https://example.com/privacy")!)
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            
            Text("订阅将自动续期，除非在当前订阅期结束前至少 24 小时关闭自动续期。费用将在确认购买后向 iTunes 账户收取。")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
        }
        .padding(.bottom, 20)
    }
    
    // MARK: - 购买逻辑
    
    private func purchase() async {
        guard let product = selectedProduct else { return }
        isPurchasing = true
        defer { isPurchasing = false }
        
        do {
            let success = try await subscriptionManager.purchase(product)
            if success {
                dismiss()
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

// MARK: - 功能对比行

struct FeatureCompareRow: View {
    let feature: String
    let freeValue: String
    let proValue: String
    
    var body: some View {
        HStack {
            Text(feature)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            Text(freeValue)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(width: 70)
            
            Text(proValue)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.orange)
                .frame(width: 70)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }
}

// MARK: - 商品卡片

struct ProductCardView: View {
    let product: Product
    let isSelected: Bool
    let isYearly: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(isYearly ? "年度订阅" : "月度订阅")
                            .font(.headline)
                        if isYearly {
                            Text("省 ¥88")
                                .font(.caption.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.red.opacity(0.1))
                                .foregroundStyle(.red)
                                .clipShape(Capsule())
                        }
                    }
                    Text("3 天免费试用")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Text(product.displayPrice)
                    .font(.title3.bold())
                    .foregroundStyle(isSelected ? .orange : .primary)
            }
            .padding()
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Color.orange : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    SubscriptionView()
        .environmentObject(SubscriptionManager())
}
