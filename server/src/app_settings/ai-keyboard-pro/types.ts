/**
 * com.jaxon.aikeyboard App 专属类型定义
 */

import { z } from 'zod';

/**
 * 快捷短语
 */
export const keywordPhraseSchema = z.object({
  id: z.string().uuid(),
  keyword: z.string().min(1).max(50),
  reply: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KeywordPhrase = z.infer<typeof keywordPhraseSchema>;

/**
 * 自定义回复配置
 */
export const customReplyConfigSchema = z.object({
  style: z.enum(['funny', 'professional', 'friendly', 'humor', 'emoji']),
  customPrompt: z.string().max(500).optional(),
  enableContext: z.boolean().default(true),
});

export type CustomReplyConfig = z.infer<typeof customReplyConfigSchema>;

/**
 * AI 键盘生成请求
 */
export const keyboardGenerateSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(['funny', 'professional', 'friendly', 'humor', 'emoji']).default('friendly'),
  customPrompt: z.string().max(500).optional(),
  context: z.string().max(200).optional(),
});

export type KeyboardGenerateInput = z.infer<typeof keyboardGenerateSchema>;

/**
 * AI 键盘生成响应
 */
export interface KeyboardGenerateOutput {
  result: string;
  style: string;
  tokens: number;
  generatedAt: Date;
}

/**
 * 关键词匹配结果
 */
export interface KeywordMatchResult {
  keyword: string;
  reply: string;
  matchType: 'exact' | 'fuzzy';
}
