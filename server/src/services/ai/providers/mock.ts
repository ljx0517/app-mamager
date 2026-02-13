import { BaseAIProvider } from "./base.js";
import type { AIProviderConfig } from "../../../db/schema.js";

/**
 * Mock AI 提供商
 * 用于开发、测试和环境验证
 */
export class MockAIProvider extends BaseAIProvider {
  readonly type = "mock" as const;
  readonly name = "Mock AI Provider";

  private replies = [
    "这是一个智能回复示例，针对您的输入进行风格化处理。",
    "根据您选择的风格，我已经调整了回复的语气和表达方式。",
    "AI正在为您生成个性化回复，这只是一个模拟响应。",
    "在实际环境中，这里将调用真实的AI服务生成高质量回复。",
    "感谢您使用我们的AI键盘服务，请继续体验更多功能。",
  ];

  private styles = [
    "正式",
    "幽默",
    "简洁",
    "详细",
    "友好",
    "专业",
    "创意",
    "鼓励",
  ];

  validateConfig(config: AIProviderConfig): boolean {
    // Mock 提供商不需要特殊验证，只需启用即可
    return config.enabled === true;
  }

  protected async _generate(params: any): Promise<{
    replies: Array<{ id: string; content: string; style?: string }>;
    tokensUsed?: number;
    metadata?: Record<string, unknown>;
  }> {
    const { text, stylePrompt, candidateCount = 1 } = params;

    // 模拟处理延迟
    await this.simulateProcessingDelay();

    const replies = Array.from({ length: candidateCount }, (_, i) => {
      const replyIndex = i % this.replies.length;
      const styleIndex = Math.floor(Math.random() * this.styles.length);

      return {
        id: this.generateReplyId(),
        content: `${this.replies[replyIndex]} [输入: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"]`,
        style: stylePrompt || this.styles[styleIndex],
      };
    });

    // 模拟使用令牌数
    const tokensUsed = text.length * 2 + replies.reduce((sum, reply) => sum + reply.content.length, 0);

    return {
      replies,
      tokensUsed,
      metadata: {
        simulated: true,
        provider: "mock",
        params,
      },
    };
  }

  /**
   * 模拟处理延迟
   */
  private simulateProcessingDelay(): Promise<void> {
    const delay = Math.random() * 500 + 100; // 100-600ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * 获取健康状态
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unavailable";
    latency?: number;
    uptime?: number;
  } {
    return {
      status: "healthy",
      uptime: 100,
    };
  }

  /**
   * 生成测试回复（用于健康检查）
   */
  async testConnection(): Promise<boolean> {
    try {
      // 生成一个简单的测试回复
      const result = await this._generate({
        text: "test",
        candidateCount: 1,
      });
      return result.replies.length > 0;
    } catch {
      return false;
    }
  }
}