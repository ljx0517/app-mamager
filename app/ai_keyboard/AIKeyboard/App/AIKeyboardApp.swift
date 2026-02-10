import SwiftUI

@main
struct AIKeyboardApp: App {
    @StateObject private var styleManager = StyleManager()
    @StateObject private var subscriptionManager = SubscriptionManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(styleManager)
                .environmentObject(subscriptionManager)
                .task {
                    // 启动时加载订阅状态
                    await subscriptionManager.loadSubscriptionStatus()
                }
        }
    }
}
