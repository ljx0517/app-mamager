import Foundation

extension UserDefaults {
    /// 使用 App Group 的 UserDefaults，主应用与键盘扩展共享
    static let shared: UserDefaults = {
        guard let defaults = UserDefaults(suiteName: AppConstants.appGroupID) else {
            fatalError("Unable to create UserDefaults with App Group: \(AppConstants.appGroupID)")
        }
        return defaults
    }()
}
