import Foundation

/// 键盘扩展专用的轻量 AI 服务
/// 独立于主应用的 AIService，避免跨 Target 依赖
enum KeyboardAIService {
    
    struct GenerateRequest: Codable {
        let message: String
        let stylePrompt: String
        let candidateCount: Int
        let model: String?
    }
    
    struct GenerateResponse: Codable {
        let replies: [String]
        let model: String
    }
    
    /// 生成 AI 回复
    static func generateReply(
        message: String,
        stylePrompt: String,
        candidateCount: Int = 1
    ) async throws -> GenerateResponse {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        AppLogger.keyboard.info("📤 [KeyboardAI] 开始生成回复")
        AppLogger.keyboard.info("📤 [KeyboardAI] 消息内容: \(message.truncated(to: 50))")
        AppLogger.keyboard.info("📤 [KeyboardAI] 风格 Prompt: \(stylePrompt.truncated(to: 80))")
        AppLogger.keyboard.info("📤 [KeyboardAI] 候选数量: \(candidateCount)")
        
        let request = GenerateRequest(
            message: message,
            stylePrompt: stylePrompt,
            candidateCount: candidateCount,
            model: nil
        )
        
        guard let url = URL(string: APIConfig.AI.generate) else {
            AppLogger.keyboard.error("❌ [KeyboardAI] API 地址无效: \(APIConfig.AI.generate)")
            throw KeyboardAIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.aiGenerateTimeout
        
        // 从 App Group 的 UserDefaults 读取 Token
        let token = UserDefaults.shared.string(forKey: "access_token")
        if let token {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        AppLogger.keyboard.info("📤 [KeyboardAI] Token 状态: \(token != nil ? "已附带" : "未设置")")
        AppLogger.network.info("🌐 [KeyboardAI] POST \(APIConfig.AI.generate)")
        
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        let elapsed = CFAbsoluteTimeGetCurrent() - startTime
        
        guard let httpResponse = response as? HTTPURLResponse else {
            AppLogger.keyboard.error("❌ [KeyboardAI] 响应无效，非 HTTP 响应，耗时: \(String(format: "%.2f", elapsed))s")
            throw KeyboardAIError.invalidResponse
        }
        
        AppLogger.network.info("🌐 [KeyboardAI] 响应状态码: \(httpResponse.statusCode), 数据大小: \(data.count) bytes, 耗时: \(String(format: "%.2f", elapsed))s")
        
        switch httpResponse.statusCode {
        case 200:
            let result = try JSONDecoder().decode(GenerateResponse.self, from: data)
            AppLogger.keyboard.info("✅ [KeyboardAI] 生成成功，返回 \(result.replies.count) 条回复，模型: \(result.model)")
            for (index, reply) in result.replies.enumerated() {
                AppLogger.keyboard.debug("💬 [KeyboardAI] 回复[\(index)]: \(reply.truncated(to: 60))")
            }
            return result
        case 429:
            AppLogger.keyboard.warning("⚠️ [KeyboardAI] 频率限制 (429)，今日免费次数已用完")
            throw KeyboardAIError.rateLimitExceeded
        case 401:
            AppLogger.keyboard.warning("⚠️ [KeyboardAI] 认证失败 (401)，Token 可能已过期")
            throw KeyboardAIError.unauthorized
        default:
            AppLogger.keyboard.error("❌ [KeyboardAI] 服务器错误 (\(httpResponse.statusCode))，响应: \(String(data: data, encoding: .utf8) ?? "无法解码")")
            throw KeyboardAIError.serverError(statusCode: httpResponse.statusCode)
        }
    }
}

// MARK: - 错误类型

enum KeyboardAIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case rateLimitExceeded
    case unauthorized
    case serverError(statusCode: Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "API 地址配置错误"
        case .invalidResponse:
            return "服务器响应异常"
        case .rateLimitExceeded:
            return "今日免费次数已用完，升级 Pro 享受无限回复"
        case .unauthorized:
            return "认证已过期，请打开主应用重新登录"
        case .serverError(let code):
            return "服务器错误 (\(code))"
        }
    }
}
