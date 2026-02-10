import Foundation

/// AI 回复生成服务
class AIService {
    static let shared = AIService()
    
    private init() {}
    
    /// AI 回复请求体
    struct GenerateRequest: Codable {
        let message: String           // 对方发来的消息
        let stylePrompt: String       // 风格 prompt
        let candidateCount: Int        // 候选回复数量
        let model: String?            // 指定 AI 模型（可选）
    }
    
    /// AI 回复响应体
    struct GenerateResponse: Codable {
        let replies: [String]          // 候选回复列表
        let model: String             // 实际使用的模型
        let usage: UsageInfo?         // 用量信息
    }
    
    struct UsageInfo: Codable {
        let dailyUsed: Int
        let dailyLimit: Int?          // nil 表示无限制
    }
    
    /// AI 模型信息
    struct AIModel: Codable, Identifiable {
        let id: String
        let name: String
        let description: String
        let isProOnly: Bool
    }
    
    // MARK: - 生成 AI 回复
    
    /// 根据对方消息和风格生成回复
    /// - Parameters:
    ///   - message: 对方的消息内容
    ///   - stylePrompt: 说话风格 prompt
    ///   - candidateCount: 候选回复数量
    ///   - model: 指定模型（可选）
    /// - Returns: 候选回复列表
    func generateReply(
        message: String,
        stylePrompt: String,
        candidateCount: Int = 1,
        model: String? = nil
    ) async throws -> GenerateResponse {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        AppLogger.ai.info("📤 [AIService] 开始生成回复")
        AppLogger.ai.info("📤 [AIService] 消息内容: \(message.truncated(to: 50))")
        AppLogger.ai.info("📤 [AIService] 风格 Prompt: \(stylePrompt.truncated(to: 80))")
        AppLogger.ai.info("📤 [AIService] 候选数量: \(candidateCount), 模型: \(model ?? "default")")
        
        let request = GenerateRequest(
            message: message,
            stylePrompt: stylePrompt,
            candidateCount: candidateCount,
            model: model
        )
        
        let url = URL(string: APIConfig.AI.generate)!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.aiGenerateTimeout
        
        // 添加认证 Token
        let hasToken = TokenManager.shared.accessToken != nil
        if let token = TokenManager.shared.accessToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        AppLogger.ai.info("📤 [AIService] Token 状态: \(hasToken ? "已附带" : "未设置")")
        AppLogger.network.info("🌐 [AIService] POST \(APIConfig.AI.generate)")
        
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        let elapsed = CFAbsoluteTimeGetCurrent() - startTime
        
        guard let httpResponse = response as? HTTPURLResponse else {
            AppLogger.ai.error("❌ [AIService] 响应无效，非 HTTP 响应，耗时: \(String(format: "%.2f", elapsed))s")
            throw AIServiceError.invalidResponse
        }
        
        AppLogger.network.info("🌐 [AIService] 响应状态码: \(httpResponse.statusCode), 数据大小: \(data.count) bytes, 耗时: \(String(format: "%.2f", elapsed))s")
        
        switch httpResponse.statusCode {
        case 200:
            let result = try JSONDecoder().decode(GenerateResponse.self, from: data)
            AppLogger.ai.info("✅ [AIService] 生成成功，返回 \(result.replies.count) 条回复，模型: \(result.model)")
            if let usage = result.usage {
                AppLogger.ai.info("📊 [AIService] 用量: 今日已用 \(usage.dailyUsed)/\(usage.dailyLimit.map { String($0) } ?? "无限")")
            }
            for (index, reply) in result.replies.enumerated() {
                AppLogger.ai.debug("💬 [AIService] 回复[\(index)]: \(reply.truncated(to: 60))")
            }
            return result
        case 429:
            AppLogger.ai.warning("⚠️ [AIService] 频率限制 (429)，今日免费次数已用完")
            throw AIServiceError.rateLimitExceeded
        case 401:
            AppLogger.ai.warning("⚠️ [AIService] 认证失败 (401)，Token 可能已过期")
            throw AIServiceError.unauthorized
        default:
            AppLogger.ai.error("❌ [AIService] 服务器错误 (\(httpResponse.statusCode))，响应: \(String(data: data, encoding: .utf8) ?? "无法解码")")
            throw AIServiceError.serverError(statusCode: httpResponse.statusCode)
        }
    }
    
    // MARK: - 获取可用模型列表
    
    func fetchAvailableModels() async throws -> [AIModel] {
        let url = URL(string: APIConfig.AI.models)!
        var urlRequest = URLRequest(url: url)
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = TokenManager.shared.accessToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        return try JSONDecoder().decode([AIModel].self, from: data)
    }
}

// MARK: - 错误类型

enum AIServiceError: LocalizedError {
    case invalidResponse
    case rateLimitExceeded
    case unauthorized
    case serverError(statusCode: Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "服务器响应异常"
        case .rateLimitExceeded:
            return "今日免费次数已用完，升级 Pro 享受无限回复"
        case .unauthorized:
            return "认证已过期，请重新登录"
        case .serverError(let code):
            return "服务器错误 (\(code))"
        }
    }
}
