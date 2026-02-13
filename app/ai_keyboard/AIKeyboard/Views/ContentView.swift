import SwiftUI

/// 主页面 - Tab 导航
struct ContentView: View {
    @EnvironmentObject var styleManager: StyleManager
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @EnvironmentObject var tagManager: TagManager

    var body: some View {
        TabView {
            StyleListView()
                .tabItem {
                    Label("风格", systemImage: "paintpalette.fill")
                }

            TagCombinationListView()
                .tabItem {
                    Label("组合", systemImage: "square.stack.fill")
                }

            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gearshape.fill")
                }
        }
        .tint(.appPrimary)
    }
}

#Preview {
    ContentView()
        .environmentObject(StyleManager())
        .environmentObject(SubscriptionManager())
        .environmentObject(TagManager.shared)
}
