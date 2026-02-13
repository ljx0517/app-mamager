import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc/index.js";
import { users, usageRecords, subscriptions, type AppSettings } from "../db/schema.js";
import { getGlobalAIService, initializeAppAIConfig } from "../services/ai/index.js";
import { TRPCError } from "@trpc/server";

/**
 * AI 路由（App 隔离）
 * 用量限制读取当前 App 的 settings 配置
 */
export const aiRouter = router({
  /**
   * 生成 AI 回复
   */
  generate: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1, "输入文本不能为空"),
        stylePrompt: z.string().optional(),
        temperature: z.number().min(0).max(2).optional().default(0.7),
        maxTokens: z.number().min(1).max(2000).optional().default(500),
        candidateCount: z.number().min(1).max(5).optional().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const appSettings = (ctx.app.settings ?? {}) as AppSettings;

      // 检查 App 是否启用 AI 功能
      if (appSettings.enableAI === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "当前应用未启用 AI 功能",
        });
      }

      // 1. 查找当前 App 下的用户
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.appId, ctx.app.id),
            eq(users.deviceId, ctx.deviceId)
          )
        )
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      // 2. 检查用量限制（从 App settings 读取）
      const freeLimit = appSettings.freeReplyLimitPerDay ?? 10;
      const today = new Date().toISOString().split("T")[0];

      const [usage] = await ctx.db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.userId, user.id),
            eq(usageRecords.date, today)
          )
        )
        .limit(1);

      // 查询订阅状态
      const [sub] = await ctx.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1);

      const isPro = sub?.tier !== "free" && sub?.status === "active";
      const currentCount = usage?.replyCount ?? 0;

      if (!isPro && currentCount >= freeLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `免费用户每日回复上限为 ${freeLimit} 次，请升级 Pro 解锁无限次数`,
        });
      }

      // 3. 获取全局 AI 服务并初始化 App 配置
      const aiService = getGlobalAIService();

      // 确保 App 的 AI 配置已初始化
      const appProviders = aiService.getAppHealth(ctx.app.id);
      if (appProviders.length === 0) {
        // 首次调用时初始化
        initializeAppAIConfig(aiService, ctx.app.id, appSettings);
      }

      // 4. 调用 AI 服务生成回复
      const aiRequest = {
        text: input.text,
        stylePrompt: input.stylePrompt,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        candidateCount: input.candidateCount,
        appId: ctx.app.id,
        userId: user.id,
      };

      const aiResponse = await aiService.generate(aiRequest);

      // 5. 更新用量记录
      if (usage) {
        await ctx.db
          .update(usageRecords)
          .set({ replyCount: currentCount + 1 })
          .where(eq(usageRecords.id, usage.id));
      } else {
        await ctx.db.insert(usageRecords).values({
          userId: user.id,
          date: today,
          replyCount: 1,
        });
      }

      return {
        replies: aiResponse.replies,
        usage: {
          today: currentCount + 1,
          limit: isPro ? null : freeLimit,
          isPro,
        },
        provider: aiResponse.provider,
      };
    }),

  /**
   * 获取可用的 AI 模型列表
   */
  models: protectedProcedure.query(async () => {
    // TODO: 后续可按 App 配置动态返回
    return [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "快速且经济的模型，适合日常对话",
        isPro: false,
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "最强大的模型，回复质量最高",
        isPro: true,
      },
    ];
  }),
});
