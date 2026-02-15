import { eq } from 'drizzle-orm';
import { db } from '@/db';
import type { KeywordMatchResult } from '../types.js';

// 模拟数据库表（实际应从 schema 导入）
// TODO: 后续需要在 db/schema.ts 中添加 userKeywords 表

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
  async matchKeyword(appId: string, deviceId: string, input: string): Promise<KeywordMatchResult | null> {
    // TODO: 从数据库查询用户的关键词配置
    // 这里先返回 null，实际实现需要查询 userKeywords 表

    // 模拟：检查是否是关键词
    const keywords = await this.getKeywords(appId, deviceId);

    // 精确匹配
    for (const kw of keywords) {
      if (input.toLowerCase().includes(kw.keyword.toLowerCase())) {
        return {
          keyword: kw.keyword,
          reply: kw.reply,
          matchType: 'exact',
        };
      }
    }

    // 模糊匹配（简单的包含检查）
    for (const kw of keywords) {
      if (this.fuzzyMatch(input, kw.keyword)) {
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
  async getKeywords(appId: string, deviceId: string): Promise<Array<{ keyword: string; reply: string }>> {
    // TODO: 从数据库查询
    // 模拟数据
    return [
      { keyword: '你好', reply: '你好呀！有什么可以帮你的吗？' },
      { keyword: '谢谢', reply: '不客气！很高兴能帮到你～' },
      { keyword: 'bye', reply: '再见！下次有需要随时找我～' },
    ];
  }

  /**
   * 模糊匹配算法
   */
  private fuzzyMatch(input: string, keyword: string): boolean {
    const inputLower = input.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    // 检查输入是否包含关键词的所有字符（顺序可能不同）
    let keywordIndex = 0;
    for (const char of inputLower) {
      if (char === keywordLower[keywordIndex]) {
        keywordIndex++;
        if (keywordIndex === keywordLower.length) {
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
    reply: string
  ): Promise<{ success: boolean; id?: string }> {
    // TODO: 写入数据库
    console.log(`[KeywordMatcher] 添加关键词: ${keyword} -> ${reply}`);
    return { success: true, id: crypto.randomUUID() };
  }

  /**
   * 删除关键词
   */
  async deleteKeyword(appId: string, deviceId: string, keyword: string): Promise<boolean> {
    // TODO: 从数据库删除
    console.log(`[KeywordMatcher] 删除关键词: ${keyword}`);
    return true;
  }

  /**
   * 更新关键词
   */
  async updateKeyword(
    appId: string,
    deviceId: string,
    keyword: string,
    newReply: string
  ): Promise<boolean> {
    // TODO: 更新数据库
    console.log(`[KeywordMatcher] 更新关键词: ${keyword} -> ${newReply}`);
    return true;
  }
}

// 导出单例
export const keywordMatcher = new KeywordMatcher();
