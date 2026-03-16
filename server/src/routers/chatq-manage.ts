/**
 * ChatQ 主数据管理（admin 专用）
 * 维度、人设标签、场景、关系、人设包的 CRUD
 */
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { router, adminProcedure } from "../trpc/index.js";
import { TRPCError } from "@trpc/server";
import {
  chatqDimensions,
  chatqPersonaTags,
  chatqScenes,
  chatqRelations,
  chatqPersonaPackages,
  type NewChatqDimension,
  type NewChatqPersonaTag,
  type NewChatqScene,
  type NewChatqRelation,
  type NewChatqPersonaPackage,
} from "../db/schema.js";

const sentimentEnum = z.enum(["positive", "neutral", "negative"]);
const genderEnum = z.enum(["male", "female", "any"]);

export const chatqManageRouter = router({
  // ---------- 维度 ----------
  listDimensions: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(chatqDimensions)
      .orderBy(asc(chatqDimensions.sort), asc(chatqDimensions.dimensionId));
  }),

  createDimension: adminProcedure
    .input(
      z.object({
        dimensionId: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(chatqDimensions)
        .values({
          dimensionId: input.dimensionId,
          name: input.name,
          description: input.description ?? null,
          sort: input.sort ?? 0,
        } as NewChatqDimension)
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建失败" });
      return row;
    }),

  updateDimension: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await ctx.db
        .update(chatqDimensions)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(chatqDimensions.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "维度不存在" });
      return row;
    }),

  deleteDimension: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(chatqDimensions).where(eq(chatqDimensions.id, input.id)).returning({ id: chatqDimensions.id });
      return { success: result.length > 0 };
    }),

  // ---------- 人设标签 ----------
  listPersonaTags: adminProcedure
    .input(z.object({ dimensionId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.dimensionId) {
        return ctx.db
          .select()
          .from(chatqPersonaTags)
          .where(eq(chatqPersonaTags.dimensionId, input.dimensionId))
          .orderBy(asc(chatqPersonaTags.sort), asc(chatqPersonaTags.tagId));
      }
      return ctx.db
        .select()
        .from(chatqPersonaTags)
        .orderBy(asc(chatqPersonaTags.dimensionId), asc(chatqPersonaTags.sort), asc(chatqPersonaTags.tagId));
    }),

  createPersonaTag: adminProcedure
    .input(
      z.object({
        dimensionId: z.string().min(1).max(50),
        tagId: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        sentiment: sentimentEnum,
        weightDefault: z.number().min(0).max(1).optional(),
        description: z.string().max(500).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(chatqPersonaTags)
        .values({
          dimensionId: input.dimensionId,
          tagId: input.tagId,
          name: input.name,
          sentiment: input.sentiment,
          weightDefault: input.weightDefault ?? 0.5,
          description: input.description ?? null,
          sort: input.sort ?? 0,
        } as NewChatqPersonaTag)
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建失败" });
      return row;
    }),

  updatePersonaTag: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        sentiment: sentimentEnum.optional(),
        weightDefault: z.number().min(0).max(1).optional(),
        description: z.string().max(500).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await ctx.db
        .update(chatqPersonaTags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chatqPersonaTags.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "标签不存在" });
      return row;
    }),

  deletePersonaTag: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(chatqPersonaTags).where(eq(chatqPersonaTags.id, input.id)).returning({ id: chatqPersonaTags.id });
      return { success: result.length > 0 };
    }),

  // ---------- 场景 ----------
  listScenes: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(chatqScenes).orderBy(asc(chatqScenes.sort), asc(chatqScenes.sceneId));
  }),

  createScene: adminProcedure
    .input(
      z.object({
        sceneId: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(20).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(chatqScenes)
        .values({
          sceneId: input.sceneId,
          name: input.name,
          description: input.description ?? null,
          icon: input.icon ?? null,
          color: input.color ?? null,
          sort: input.sort ?? 0,
        } as NewChatqScene)
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建失败" });
      return row;
    }),

  updateScene: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(20).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await ctx.db
        .update(chatqScenes)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chatqScenes.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "场景不存在" });
      return row;
    }),

  deleteScene: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(chatqScenes).where(eq(chatqScenes.id, input.id)).returning({ id: chatqScenes.id });
      return { success: result.length > 0 };
    }),

  // ---------- 关系 ----------
  listRelations: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(chatqRelations).orderBy(asc(chatqRelations.sort), asc(chatqRelations.relationId));
  }),

  createRelation: adminProcedure
    .input(
      z.object({
        relationId: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(chatqRelations)
        .values({
          relationId: input.relationId,
          name: input.name,
          description: input.description ?? null,
          sort: input.sort ?? 0,
        } as NewChatqRelation)
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建失败" });
      return row;
    }),

  updateRelation: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await ctx.db
        .update(chatqRelations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chatqRelations.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "关系不存在" });
      return row;
    }),

  deleteRelation: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(chatqRelations).where(eq(chatqRelations.id, input.id)).returning({ id: chatqRelations.id });
      return { success: result.length > 0 };
    }),

  // ---------- 人设包 ----------
  listPersonaPackages: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(chatqPersonaPackages).orderBy(asc(chatqPersonaPackages.sort), asc(chatqPersonaPackages.packageId));
  }),

  createPersonaPackage: adminProcedure
    .input(
      z.object({
        packageId: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        gender: genderEnum,
        ageRange: z.array(z.string()).optional(),
        tags: z.array(z.string()),
        scenes: z.array(z.string()),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(chatqPersonaPackages)
        .values({
          packageId: input.packageId,
          name: input.name,
          description: input.description ?? null,
          gender: input.gender,
          ageRange: input.ageRange ?? [],
          tags: input.tags,
          scenes: input.scenes,
          sort: input.sort ?? 0,
        } as NewChatqPersonaPackage)
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "创建失败" });
      return row;
    }),

  updatePersonaPackage: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        gender: genderEnum.optional(),
        ageRange: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        scenes: z.array(z.string()).optional(),
        sort: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const [row] = await ctx.db
        .update(chatqPersonaPackages)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chatqPersonaPackages.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "人设包不存在" });
      return row;
    }),

  deletePersonaPackage: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.delete(chatqPersonaPackages).where(eq(chatqPersonaPackages.id, input.id)).returning({ id: chatqPersonaPackages.id });
      return { success: result.length > 0 };
    }),
});
