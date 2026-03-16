import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { router, adminProcedure } from "../trpc/index.js";
import { configTemplates, type NewConfigTemplate } from "../db/schema.js";
import { TRPCError } from "@trpc/server";

/**
 * 配置模板路由（管理后台）
 *
 * 功能：
 *  template.list    - 获取模板列表
 *  template.create  - 创建模板
 *  template.update  - 更新模板
 *  template.delete  - 删除模板
 *  template.duplicate - 复制模板
 */
export const templateRouter = router({
  /**
   * 获取模板列表
   */
  list: adminProcedure.query(async ({ ctx }) => {
    const templates = await ctx.db
      .select()
      .from(configTemplates)
      .where(eq(configTemplates.isActive, true))
      .orderBy(asc(configTemplates.sortOrder), asc(configTemplates.displayName));

    return templates.map((t: typeof configTemplates.$inferSelect) => ({
      id: t.id,
      templateId: t.templateId,
      displayName: t.displayName,
      icon: t.icon,
      description: t.description,
      componentPath: t.componentPath,
      defaultConfig: t.defaultConfig,
      isBuiltin: t.isBuiltin,
      sortOrder: t.sortOrder,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }),

  /**
   * 获取所有模板（包括禁用的）
   */
  listAll: adminProcedure.query(async ({ ctx }) => {
    const templates = await ctx.db
      .select()
      .from(configTemplates)
      .orderBy(asc(configTemplates.sortOrder), asc(configTemplates.displayName));

    return templates.map((t: typeof configTemplates.$inferSelect) => ({
      id: t.id,
      templateId: t.templateId,
      displayName: t.displayName,
      icon: t.icon,
      description: t.description,
      componentPath: t.componentPath,
      defaultConfig: t.defaultConfig,
      isBuiltin: t.isBuiltin,
      isActive: t.isActive,
      sortOrder: t.sortOrder,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }),

  /**
   * 获取单个模板详情
   */
  get: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "模板不存在",
        });
      }

      return {
        id: template.id,
        templateId: template.templateId,
        displayName: template.displayName,
        icon: template.icon,
        description: template.description,
        componentPath: template.componentPath,
        defaultConfig: template.defaultConfig,
        isBuiltin: template.isBuiltin,
        isActive: template.isActive,
        sortOrder: template.sortOrder,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    }),

  /**
   * 根据 templateId 获取模板
   */
  getByTemplateId: adminProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.templateId, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "模板不存在",
        });
      }

      return {
        id: template.id,
        templateId: template.templateId,
        displayName: template.displayName,
        icon: template.icon,
        description: template.description,
        componentPath: template.componentPath,
        defaultConfig: template.defaultConfig,
        isBuiltin: template.isBuiltin,
        isActive: template.isActive,
        sortOrder: template.sortOrder,
      };
    }),

  /**
   * 创建模板
   */
  create: adminProcedure
    .input(
      z.object({
        templateId: z.string().min(1).max(100),
        displayName: z.string().min(1).max(100),
        icon: z.string().max(10).optional().default("📦"),
        description: z.string().optional(),
        componentPath: z.string().min(1).max(255),
        defaultConfig: z.record(z.unknown()).optional(),
        isActive: z.boolean().optional().default(true),
        sortOrder: z.number().int().min(0).optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查 templateId 是否已存在
      const [existing] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.templateId, input.templateId))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `模板 ID "${input.templateId}" 已存在`,
        });
      }

      const [template] = await ctx.db
        .insert(configTemplates)
        .values({
          templateId: input.templateId,
          displayName: input.displayName,
          icon: input.icon,
          description: input.description,
          componentPath: input.componentPath,
          defaultConfig: input.defaultConfig ?? {},
          isBuiltin: false,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
        } as NewConfigTemplate)
        .returning();

      return {
        template: {
          id: template.id,
          templateId: template.templateId,
          displayName: template.displayName,
          icon: template.icon,
          description: template.description,
          componentPath: template.componentPath,
          isBuiltin: template.isBuiltin,
        },
        message: "模板创建成功",
      };
    }),

  /**
   * 更新模板
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        templateId: z.string().min(1).max(100).optional(),
        displayName: z.string().min(1).max(100).optional(),
        icon: z.string().max(10).optional(),
        description: z.string().optional(),
        componentPath: z.string().min(1).max(255).optional(),
        defaultConfig: z.record(z.unknown()).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, templateId, ...updates } = input;

      // 检查模板是否存在
      const [existing] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.id, id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "模板不存在",
        });
      }

      // 内置模板不可修改核心字段
      if (existing.isBuiltin) {
        if (input.templateId !== undefined || input.componentPath !== undefined) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "内置模板的核心字段不可修改",
          });
        }
      }

      const [template] = await ctx.db
        .update(configTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(configTemplates.id, id))
        .returning();

      return {
        template: {
          id: template.id,
          templateId: template.templateId,
          displayName: template.displayName,
          icon: template.icon,
          description: template.description,
          componentPath: template.componentPath,
          isBuiltin: template.isBuiltin,
          isActive: template.isActive,
        },
        message: "模板更新成功",
      };
    }),

  /**
   * 删除模板
   */
  delete: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查模板是否存在
      const [existing] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "模板不存在",
        });
      }

      // 内置模板不可删除
      if (existing.isBuiltin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "内置模板不可删除",
        });
      }

      await ctx.db
        .delete(configTemplates)
        .where(eq(configTemplates.id, input.id));

      return {
        message: "模板删除成功",
      };
    }),

  /**
   * 复制模板
   */
  duplicate: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        newTemplateId: z.string().min(1).max(100),
        newDisplayName: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查原模板是否存在
      const [existing] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "原模板不存在",
        });
      }

      // 检查新 templateId 是否已存在
      const [duplicateCheck] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.templateId, input.newTemplateId))
        .limit(1);

      if (duplicateCheck) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `模板 ID "${input.newTemplateId}" 已存在`,
        });
      }

      const [template] = await ctx.db
        .insert(configTemplates)
        .values({
          templateId: input.newTemplateId,
          displayName: input.newDisplayName,
          icon: existing.icon,
          description: existing.description,
          componentPath: existing.componentPath,
          defaultConfig: existing.defaultConfig,
          isBuiltin: false,
          isActive: true,
          sortOrder: existing.sortOrder + 1,
        } as NewConfigTemplate)
        .returning();

      return {
        template: {
          id: template.id,
          templateId: template.templateId,
          displayName: template.displayName,
          icon: template.icon,
        },
        message: "模板复制成功",
      };
    }),

  /**
   * 初始化内置模板
   * 系统首次启动时调用，确保内置模板存在
   */
  initBuiltin: adminProcedure.mutation(async ({ ctx }) => {
    const builtinTemplates = [
      {
        templateId: "ai-keyboard",
        displayName: "AI Keyboard",
        icon: "⌨️",
        description: "智能键盘应用配置模板",
        componentPath: "@/pages/Settings/configs/ai-keyboard",
        defaultConfig: {
          freeReplyLimitPerDay: 10,
          freeCandidateCount: 1,
          proCandidateCount: 5,
          enableAI: true,
          enableSubscription: true,
        },
      },
      {
        templateId: "chatq",
        displayName: "ChatQ",
        icon: "💬",
        description: "ChatQ AI 聊天应用配置模板",
        componentPath: "@/pages/Settings/configs/chatq",
        defaultConfig: {
          freeReplyLimitPerDay: 50,
          freeCandidateCount: 1,
          proCandidateCount: 3,
          enableAI: true,
          enableSubscription: true,
          features: {
            customReply: true,
            keywordReply: true,
            enableQuickPhrases: true,
            enableContextAware: true,
            enableCloudSync: false,
            enableAnalytics: true,
            enableAISmartAdjust: false,
          },
          limits: {
            maxKeywordCount: 100,
            maxPhraseLength: 500,
            dailyGenerationLimit: 1000,
            maxPersonaCards: 0,
          },
          sceneIds: ["daily", "workplace", "sales", "customer_service", "dating", "flirt", "apology", "greeting"],
          relationIds: ["lover", "ambiguous", "bestie", "friend", "colleague", "superior", "subordinate", "customer", "prospect", "stranger"],
          defaultPersonaPackageIds: ["sweet_girlfriend", "cool_boyfriend", "professional_colleague", "sales_champion", "bestie", "smooth_operator", "gentle_cs", "romantic_poet"],
        },
      },
    ];

    const results: Array<{ templateId: string; status: string }> = [];

    for (const tmpl of builtinTemplates) {
      const [existing] = await ctx.db
        .select()
        .from(configTemplates)
        .where(eq(configTemplates.templateId, tmpl.templateId))
        .limit(1);

      if (existing) {
        results.push({ templateId: tmpl.templateId, status: "exists" });
      } else {
        await ctx.db.insert(configTemplates).values({
          templateId: tmpl.templateId,
          displayName: tmpl.displayName,
          icon: tmpl.icon,
          description: tmpl.description,
          componentPath: tmpl.componentPath,
          defaultConfig: tmpl.defaultConfig,
          isBuiltin: true,
          isActive: true,
          sortOrder: results.length,
        } as NewConfigTemplate);
        results.push({ templateId: tmpl.templateId, status: "created" });
      }
    }

    return {
      results,
      message: "内置模板初始化完成",
    };
  }),
});
