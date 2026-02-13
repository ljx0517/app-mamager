import SwiftUI

@main
struct AIKeyboardApp: App {
    @StateObject private var styleManager = StyleManager()
    @StateObject private var subscriptionManager = SubscriptionManager()
    @StateObject private var tagManager = TagManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(styleManager)
                .environmentObject(subscriptionManager)
                .environmentObject(tagManager)
                .task {
                    // 启动时加载订阅状态
                    await subscriptionManager.loadSubscriptionStatus()
                }
        }
    }
}
