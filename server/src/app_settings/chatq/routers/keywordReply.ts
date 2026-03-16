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
   * POST /trpc/chatq.keywordReply.match
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
   * GET /trpc/chatq.keywordReply.list
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keywords = await keywordMatcher.getKeywords(ctx.app.id, ctx.deviceId!);
    return keywords;
  }),

  /**
   * 添加关键词
   * POST /trpc/chatq.keywordReply.add
   */
  add: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(1).max(50),
        reply: z.string().min(1).max(500),
        matchType: z.enum(['exact', 'fuzzy']).default('exact'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await keywordMatcher.addKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.keyword,
        input.reply,
        input.matchType
      );

      if (!result.success) {
        throw new Error(result.error || '添加关键词失败');
      }

      return {
        success: true,
        id: result.id,
        keyword: input.keyword,
        reply: input.reply,
        matchType: input.matchType,
      };
    }),

  /**
   * 更新关键词
   * POST /trpc/chatq.keywordReply.update
   */
  update: protectedProcedure
    .input(
      z.object({
        keywordId: z.string().uuid(),
        keyword: z.string().min(1).max(50).optional(),
        reply: z.string().min(1).max(500).optional(),
        matchType: z.enum(['exact', 'fuzzy']).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { keywordId, ...updates } = input;

      // 如果同时提供 keyword 和 reply，确保 keyword 唯一性
      if (updates.keyword) {
        const existing = await keywordMatcher.getKeywords(ctx.app.id, ctx.deviceId!);
        const duplicate = existing.find(
          (k) => k.keyword === updates.keyword && k.id !== keywordId
        );
        if (duplicate) {
          throw new Error('关键词已存在');
        }
      }

      const success = await keywordMatcher.updateKeyword(
        ctx.app.id,
        ctx.deviceId!,
        keywordId,
        updates
      );

      if (!success) {
        throw new Error('更新关键词失败');
      }

      return { success: true };
    }),

  /**
   * 删除关键词
   * POST /trpc/chatq.keywordReply.delete
   */
  delete: protectedProcedure
    .input(
      z.object({
        keywordId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await keywordMatcher.deleteKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.keywordId
      );

      if (!success) {
        throw new Error('删除关键词失败');
      }

      return { success: true };
    }),

  /**
   * 切换关键词状态
   * POST /trpc/chatq.keywordReply.toggle
   */
  toggle: protectedProcedure
    .input(
      z.object({
        keywordId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await keywordMatcher.toggleKeyword(
        ctx.app.id,
        ctx.deviceId!,
        input.keywordId
      );

      if (!success) {
        throw new Error('切换状态失败');
      }

      return { success: true };
    }),

  /**
   * 批量导入关键词
   * POST /trpc/chatq.keywordReply.import
   */
  import: protectedProcedure
    .input(
      z.array(
        z.object({
          keyword: z.string().min(1).max(50),
          reply: z.string().min(1).max(500),
          matchType: z.enum(['exact', 'fuzzy']).default('exact'),
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
            item.reply,
            item.matchType
          );
          if (result.success) successCount++;
          else if (result.error) errors.push(result.error);
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
   * GET /trpc/chatq.keywordReply.export
   */
  export: protectedProcedure.query(async ({ ctx }) => {
    const keywords = await keywordMatcher.getKeywords(ctx.app.id, ctx.deviceId!);
    return keywords;
  }),

  /**
   * 获取关键词统计
   * GET /trpc/chatq.keywordReply.stats
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    return keywordMatcher.getKeywordStats(ctx.app.id, ctx.deviceId!);
  }),
});
