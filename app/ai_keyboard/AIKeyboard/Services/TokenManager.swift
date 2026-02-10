import Foundation
import Security

/// Token 管理器 - 管理用户认证 Token
class TokenManager {
    static let shared = TokenManager()
    
    private let accessTokenKey = "com.jaxon.aikeyboard.accessToken"
    private let refreshTokenKey = "com.jaxon.aikeyboard.refreshToken"
    private let deviceIDKey = "device_id"
    
    private init() {}
    
    // MARK: - Access Token
    
    var accessToken: String? {
        get { getFromKeychain(key: accessTokenKey) }
        set {
            if let value = newValue {
                saveToKeychain(key: accessTokenKey, value: value)
            } else {
                deleteFromKeychain(key: accessTokenKey)
            }
        }
    }
    
    // MARK: - Refresh Token
    
    var refreshToken: String? {
        get { getFromKeychain(key: refreshTokenKey) }
        set {
            if let value = newValue {
                saveToKeychain(key: refreshTokenKey, value: value)
            } else {
                deleteFromKeychain(key: refreshTokenKey)
            }
        }
    }
    
    // MARK: - Device ID
    
    /// 获取或生成唯一设备 ID
    var deviceID: String {
        if let id = UserDefaults.shared.string(forKey: deviceIDKey) {
            return id
        }
        let newID = UUID().uuidString
        UserDefaults.shared.set(newID, forKey: deviceIDKey)
        return newID
    }
    
    // MARK: - 设备注册
    
    /// 注册设备并获取 Token
    func registerDevice() async throws {
        guard let url = URL(string: APIConfig.User.register) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["deviceId": deviceID]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        struct TokenResponse: Codable {
            let accessToken: String
            let refreshToken: String
        }
        
        let response = try JSONDecoder().decode(TokenResponse.self, from: data)
        accessToken = response.accessToken
        refreshToken = response.refreshToken
    }
    
    /// 刷新 Token
    func refreshAccessToken() async throws {
        guard let currentRefreshToken = refreshToken,
              let url = URL(string: APIConfig.User.refresh) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["refreshToken": currentRefreshToken]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        struct TokenResponse: Codable {
            let accessToken: String
            let refreshToken: String
        }
        
        let response = try JSONDecoder().decode(TokenResponse.self, from: data)
        accessToken = response.accessToken
        refreshToken = response.refreshToken
    }
    
    /// 清除所有 Token
    func clearTokens() {
        accessToken = nil
        refreshToken = nil
    }
    
    // MARK: - Keychain 操作
    
    private func saveToKeychain(key: String, value: String) {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func getFromKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    private func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
