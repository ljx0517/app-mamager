import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, appProcedure, protectedProcedure } from "../trpc/index.js";
import { styles, users } from "../db/schema.js";
import { TRPCError } from "@trpc/server";

/**
 * 风格路由（App 隔离）
 * 内置风格按 App 区分，用户自定义风格同样受 App 限制
 */
export const styleRouter = router({
  /**
   * 获取当前 App 的所有内置风格
   */
  builtinList: appProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(styles)
      .where(
        and(
          eq(styles.appId, ctx.app.id),
          eq(styles.isBuiltin, true)
        )
      );
  }),

  /**
   * 获取用户自定义风格
   */
  userList: protectedProcedure.query(async ({ ctx }) => {
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

    return await ctx.db
      .select()
      .from(styles)
      .where(
        and(
          eq(styles.appId, ctx.app.id),
          eq(styles.userId, user.id),
          eq(styles.isBuiltin, false)
        )
      );
  }),

  /**
   * 创建自定义风格
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(20).optional(),
        prompt: z.string().min(1),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(1).max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      const [style] = await ctx.db
        .insert(styles)
        .values({
          appId: ctx.app.id,
          userId: user.id,
          name: input.name,
          description: input.description,
          icon: input.icon,
          color: input.color,
          prompt: input.prompt,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          isBuiltin: false,
        })
        .returning();

      return style;
    }),

  /**
   * 更新自定义风格
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(20).optional(),
        prompt: z.string().min(1).optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(1).max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      const { id, ...updateData } = input;

      const [updated] = await ctx.db
        .update(styles)
        .set({ ...updateData, updatedAt: new Date() })
        .where(
          and(
            eq(styles.id, id),
            eq(styles.appId, ctx.app.id),
            eq(styles.userId, user.id)
          )
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "风格不存在或无权修改",
        });
      }

      return updated;
    }),

  /**
   * 删除自定义风格
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
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

      const [deleted] = await ctx.db
        .delete(styles)
        .where(
          and(
            eq(styles.id, input.id),
            eq(styles.appId, ctx.app.id),
            eq(styles.userId, user.id),
            eq(styles.isBuiltin, false)
          )
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "风格不存在或无法删除内置风格",
        });
      }

      return { success: true, message: "风格已删除" };
    }),
});
