import { z } from 'zod';
import { router, protectedProcedure } from '@/trpc';
import { keywordMatcher } from '../services/KeywordMatcher.js';

/**
 * 关键词自动回复路由
 *
 * 功能：
 * - 管理关键词-回复映射
 * - 智能匹配输入内容
 * - 支持精确和模糊匹配
 */
export const keywordReplyRouter = router({
  /**
   * 检测输入是否匹配关键词
   * POST /trpc/com.jaxon.aikeyboard.keywordReply.match
   */
  match: protectedProcedure
    .input(
      z.object({
        input: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await keywordMatcher.matchKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.input
      );

      if (result) {
        return {
          matched: true,
          ...result,
        };
      }

      return {
        matched: false,
      };
    }),

  /**
   * 获取所有关键词列表
   * GET /trpc/com.jaxon.aikeyboard.keywordReply.list
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keywords = await keywordMatcher.getKeywords(ctx.app.id, ctx.deviceId!);
    return keywords.map((kw, index) => ({
      id: `kw-${index}`,
      keyword: kw.keyword,
      reply: kw.reply,
      isActive: true,
    }));
  }),

  /**
   * 添加关键词
   * POST /trpc/com.jaxon.aikeyboard.keywordReply.add
   */
  add: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(1).max(50),
        reply: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await keywordMatcher.addKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.keyword,
        input.reply
      );

      return {
        success: result.success,
        id: result.id,
        keyword: input.keyword,
        reply: input.reply,
      };
    }),

  /**
   * 更新关键词
   * POST /trpc/com.jaxon.aikeyboard.keywordReply.update
   */
  update: protectedProcedure
    .input(
      z.object({
        keywordId: z.string(),
        newKeyword: z.string().min(1).max(50).optional(),
        newReply: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: 先获取旧关键词，再更新
      const success = await keywordMatcher.updateKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.keywordId, // TODO: 需要从 DB 查询获取实际 keyword
        input.newReply
      );

      return { success };
    }),

  /**
   * 删除关键词
   * POST /trpc/com.jaxon.aikeyboard.keywordReply.delete
   */
  delete: protectedProcedure
    .input(
      z.object({
        keywordId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: 需要从 DB 查询获取实际 keyword
      const success = await keywordMatcher.deleteKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.keywordId
      );

      return { success };
    }),

  /**
   * 批量导入关键词
   * POST /trpc/com.jaxon.aikeyboard.keywordReply.import
   */
  import: protectedProcedure
    .input(
      z.array(
        z.object({
          keyword: z.string().min(1).max(50),
          reply: z.string().min(1).max(500),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      let successCount = 0;
      const errors: string[] = [];

      for (const item of input) {
        try {
          const result = await keywordMatcher.addKeyword(
            ctx.app.id,
            ctx.deviceId!,
            item.keyword,
            item.reply
          );
          if (result.success) successCount++;
        } catch (e) {
          errors.push(`关键词 "${item.keyword}" 导入失败`);
        }
      }

      return {
        success: true,
        imported: successCount,
        total: input.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  /**
   * 导出关键词
   * GET /trpc/com.jaxon.aikeyboard.keywordReply.export
   */
  export: protectedProcedure.query(async ({ ctx }) => {
    const keywords = await keywordMatcher.getKeywords(ctx.app.id, ctx.deviceId!);
    return keywords;
  }),
});
