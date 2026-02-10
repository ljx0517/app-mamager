import Foundation

/// 服务端 API 配置
enum APIConfig {
    /// 服务端基础 URL（开发环境请修改为本地地址）
    #if DEBUG
    static let baseURL = "http://localhost:3000/api"
    #else
    static let baseURL = "https://your-production-server.com/api"
    #endif
    
    // MARK: - 订阅相关
    
    enum Subscription {
        static let verify = "\(baseURL)/subscription/verify"
        static let status = "\(baseURL)/subscription/status"
        static let restore = "\(baseURL)/subscription/restore"
    }
    
    // MARK: - AI 相关
    
    enum AI {
        static let generate = "\(baseURL)/ai/generate"
        static let models = "\(baseURL)/ai/models"
    }
    
    // MARK: - 用户相关
    
    enum User {
        static let register = "\(baseURL)/user/register"
        static let refresh = "\(baseURL)/user/refresh"
    }
    
    // MARK: - 请求超时时间（秒）
    
    static let requestTimeout: TimeInterval = 30
    static let aiGenerateTimeout: TimeInterval = 60
}
