import { z } from 'zod';
import { router, protectedProcedure } from '@/trpc';
import type { KeyboardGenerateOutput } from '../types.js';

/**
 * 自定义回复路由
 *
 * 功能：
 * - 生成自定义风格的 AI 回复
 * - 快捷短语管理
 * - 上下文感知回复
 */
export const customReplyRouter = router({
  /**
   * 生成自定义回复
   * POST /trpc/com.jaxon.aikeyboard.customReply.generate
   */
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(1000),
        style: z.enum(['funny', 'professional', 'friendly', 'humor', 'emoji']).default('friendly'),
        customPrompt: z.string().max(500).optional(),
        context: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<KeyboardGenerateOutput> => {
      const { prompt, style, customPrompt, context } = input;

      // 构建完整的 prompt
      let fullPrompt = customPrompt
        ? `${customPrompt}\n\n用户请求: ${prompt}`
        : prompt;

      if (context) {
        fullPrompt = `上下文: ${context}\n\n${fullPrompt}`;
      }

      // 添加风格指导
      const styleGuidance: Record<string, string> = {
        funny: '用幽默诙谐的方式回复，带点俏皮和逗趣',
        professional: '用专业正式的方式回复，保持礼貌和专业',
        friendly: '用友好亲切的方式回复，像朋友聊天一样',
        humor: '用轻松搞笑的方式回复，让对方会心一笑',
        emoji: '在回复中加入适量的 Emoji，使内容更生动',
      };

      fullPrompt += `\n\n请用${style}的风格回复。`;

      // TODO: 调用实际的 AI 服务
      // 这里模拟返回
      const mockResults: Record<string, string> = {
        funny: `哈哈，这个问题问得好！让我来逗你一笑～${prompt}的最佳答案就是：笑一笑，十年少！😄`,
        professional: `您好，关于您的问题${prompt}，我建议您考虑以下几点...`,
        friendly: `嗨！看到你的问题了～${prompt}这个我很乐意帮忙！`,
        humor: `哎呀妈呀，你可真会问！${prompt}这个事儿吧...😂`,
        emoji: `收到你的问题啦！${prompt}～让我来帮你✨`,
      };

      return {
        result: mockResults[style] || mockResults.friendly,
        style,
        tokens: Math.floor(fullPrompt.length / 4),
        generatedAt: new Date(),
      };
    }),

  /**
   * 获取可用风格列表
   * GET /trpc/com.jaxon.aikeyboard.customReply.styles
   */
  styles: protectedProcedure.query(() => {
    return [
      { id: 'funny', name: '幽默风趣', description: '轻松搞笑的风格' },
      { id: 'professional', name: '专业正式', description: '商务场合适用' },
      { id: 'friendly', name: '友好亲切', description: '日常聊天首选' },
      { id: 'humor', name: '轻松搞笑', description: '幽默段子风格' },
      { id: 'emoji', name: 'Emoji 风格', description: '带表情的活泼回复' },
    ];
  }),

  /**
   * 保存常用短语
   * POST /trpc/com.jaxon.aikeyboard.customReply.savePhrase
   */
  savePhrase: protectedProcedure
    .input(
      z.object({
        phrase: z.string().min(1).max(500),
        label: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: 保存到数据库
      console.log(`[customReply] 保存短语: ${input.label || input.phrase.slice(0, 20)}`);
      return {
        success: true,
        id: crypto.randomUUID(),
        phrase: input.phrase,
        label: input.label,
      };
    }),

  /**
   * 获取常用短语列表
   * GET /trpc/com.jaxon.aikeyboard.customReply.listPhrases
   */
  listPhrases: protectedProcedure.query(async ({ ctx }) => {
    // TODO: 从数据库查询
    return [
      { id: '1', phrase: '好的，没问题！', label: '确认' },
      { id: '2', phrase: '谢谢你的帮助！', label: '感谢' },
      { id: '3', phrase: '收到，我会尽快处理', label: '收到' },
    ];
  }),

  /**
   * 删除短语
   * POST /trpc/com.jaxon.aikeyboard.customReply.deletePhrase
   */
  deletePhrase: protectedProcedure
    .input(z.object({ phraseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: 从数据库删除
      console.log(`[customReply] 删除短语: ${input.phraseId}`);
      return { success: true };
    }),
});
