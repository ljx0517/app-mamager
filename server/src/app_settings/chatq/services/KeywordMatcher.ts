import { eq, and, or, ilike, sql } from 'drizzle-orm';
import { db } from '@/db';
import { userKeywords } from '@/db/schema.js';
import type { KeywordMatchResult } from '../types.js';

/**
 * 关键词匹配服务
 *
 * 功能：
 * - 管理用户的关键词-回复映射
 * - 支持精确匹配和模糊匹配
 * - 提供高效的关键词查询
 */
export class KeywordMatcher {
  /**
   * 根据输入文本匹配关键词
   */
  async matchKeyword(
    appId: string,
    deviceId: string,
    input: string
  ): Promise<KeywordMatchResult | null> {
    // 查询该用户的所有活跃关键词
    const keywords = await db
      .select({
        keyword: userKeywords.keyword,
        reply: userKeywords.reply,
        matchType: userKeywords.matchType,
      })
      .from(userKeywords)
      .where(
        and(
          eq(userKeywords.appId, appId),
          eq(userKeywords.deviceId, deviceId),
          eq(userKeywords.isActive, true)
        )
      )
      .limit(100);

    if (keywords.length === 0) {
      return null;
    }

    const inputLower = input.toLowerCase();

    // 精确匹配（优先）
    for (const kw of keywords) {
      if (kw.matchType === 'exact' && inputLower.includes(kw.keyword.toLowerCase())) {
        return {
          keyword: kw.keyword,
          reply: kw.reply,
          matchType: 'exact',
        };
      }
    }

    // 模糊匹配
    for (const kw of keywords) {
      if (kw.matchType === 'fuzzy' && this.fuzzyMatch(inputLower, kw.keyword.toLowerCase())) {
        return {
          keyword: kw.keyword,
          reply: kw.reply,
          matchType: 'fuzzy',
        };
      }
    }

    return null;
  }

  /**
   * 获取用户的所有关键词
   */
  async getKeywords(
    appId: string,
    deviceId: string
  ): Promise<Array<{ id: string; keyword: string; reply: string; isActive: boolean }>> {
    const keywords = await db
      .select({
        id: userKeywords.id,
        keyword: userKeywords.keyword,
        reply: userKeywords.reply,
        isActive: userKeywords.isActive,
      })
      .from(userKeywords)
      .where(and(eq(userKeywords.appId, appId), eq(userKeywords.deviceId, deviceId)))
      .orderBy(userKeywords.createdAt);

    return keywords;
  }

  /**
   * 模糊匹配算法
   */
  private fuzzyMatch(input: string, keyword: string): boolean {
    // 检查输入是否包含关键词的所有字符（顺序可能不同）
    let keywordIndex = 0;
    for (const char of input) {
      if (char === keyword[keywordIndex]) {
        keywordIndex++;
        if (keywordIndex === keyword.length) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 添加关键词
   */
  async addKeyword(
    appId: string,
    deviceId: string,
    keyword: string,
    reply: string,
    matchType: 'exact' | 'fuzzy' = 'exact'
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // 检查关键词数量限制
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userKeywords)
        .where(and(eq(userKeywords.appId, appId), eq(userKeywords.deviceId, deviceId)));

      const currentCount = countResult[0]?.count || 0;
      const MAX_KEYWORDS = 100;

      if (currentCount >= MAX_KEYWORDS) {
        return {
          success: false,
          error: `关键词数量已达上限 (${MAX_KEYWORDS})`,
        };
      }

      // 检查关键词是否已存在
      const existing = await db
        .select()
        .from(userKeywords)
        .where(
          and(
            eq(userKeywords.appId, appId),
            eq(userKeywords.deviceId, deviceId),
            eq(userKeywords.keyword, keyword)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          success: false,
          error: '关键词已存在',
        };
      }

      const [newKeyword] = await db
        .insert(userKeywords)
        .values({
          appId,
          deviceId,
          keyword,
          reply,
          matchType,
          isActive: true,
        })
        .returning({ id: userKeywords.id });

      return { success: true, id: newKeyword.id };
    } catch (error) {
      console.error('[KeywordMatcher] 添加关键词失败:', error);
      return { success: false, error: '添加关键词失败' };
    }
  }

  /**
   * 删除关键词
   */
  async deleteKeyword(
    appId: string,
    deviceId: string,
    keywordId: string
  ): Promise<boolean> {
    try {
      const result = await db
        .delete(userKeywords)
        .where(
          and(
            eq(userKeywords.id, keywordId),
            eq(userKeywords.appId, appId),
            eq(userKeywords.deviceId, deviceId)
          )
        )
        .returning({ id: userKeywords.id });

      return result.length > 0;
    } catch (error) {
      console.error('[KeywordMatcher] 删除关键词失败:', error);
      return false;
    }
  }

  /**
   * 更新关键词
   */
  async updateKeyword(
    appId: string,
    deviceId: string,
    keywordId: string,
    updates: {
      keyword?: string;
      reply?: string;
      matchType?: 'exact' | 'fuzzy';
      isActive?: boolean;
    }
  ): Promise<boolean> {
    try {
      const updateData: Partial<typeof userKeywords.$inferInsert> = {
        ...updates,
        updatedAt: new Date(),
      };

      const result = await db
        .update(userKeywords)
        .set(updateData)
        .where(
          and(
            eq(userKeywords.id, keywordId),
            eq(userKeywords.appId, appId),
            eq(userKeywords.deviceId, deviceId)
          )
        )
        .returning({ id: userKeywords.id });

      return result.length > 0;
    } catch (error) {
      console.error('[KeywordMatcher] 更新关键词失败:', error);
      return false;
    }
  }

  /**
   * 切换关键词状态
   */
  async toggleKeyword(
    appId: string,
    deviceId: string,
    keywordId: string
  ): Promise<boolean> {
    try {
      // 先获取当前状态
      const [keyword] = await db
        .select({ isActive: userKeywords.isActive })
        .from(userKeywords)
        .where(
          and(
            eq(userKeywords.id, keywordId),
            eq(userKeywords.appId, appId),
            eq(userKeywords.deviceId, deviceId)
          )
        )
        .limit(1);

      if (!keyword) {
        return false;
      }

      // 切换状态
      const result = await db
        .update(userKeywords)
        .set({ isActive: !keyword.isActive, updatedAt: new Date() })
        .where(
          and(
            eq(userKeywords.id, keywordId),
            eq(userKeywords.appId, appId),
            eq(userKeywords.deviceId, deviceId)
          )
        )
        .returning({ id: userKeywords.id });

      return result.length > 0;
    } catch (error) {
      console.error('[KeywordMatcher] 切换关键词状态失败:', error);
      return false;
    }
  }

  /**
   * 获取关键词统计
   */
  async getKeywordStats(appId: string, deviceId: string): Promise<{
    total: number;
    active: number;
    exactMatch: number;
    fuzzyMatch: number;
  }> {
    const keywords = await db
      .select({
        isActive: userKeywords.isActive,
        matchType: userKeywords.matchType,
      })
      .from(userKeywords)
      .where(and(eq(userKeywords.appId, appId), eq(userKeywords.deviceId, deviceId)));

    return {
      total: keywords.length,
      active: keywords.filter((k) => k.isActive).length,
      exactMatch: keywords.filter((k) => k.matchType === 'exact').length,
      fuzzyMatch: keywords.filter((k) => k.matchType === 'fuzzy').length,
    };
  }
}

// 导出单例
export const keywordMatcher = new KeywordMatcher();
