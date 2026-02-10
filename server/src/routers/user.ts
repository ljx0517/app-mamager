import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, appProcedure, protectedProcedure } from "../trpc/index.js";
import { users, subscriptions } from "../db/schema.js";

/**
 * 用户路由（App 隔离）
 * 所有用户操作都限定在当前 App 范围内
 */
export const userRouter = router({
  /**
   * 设备注册
   * 客户端首次启动时调用，通过 deviceId 在当前 App 下注册用户
   */
  register: appProcedure
    .input(
      z.object({
        deviceId: z.string().min(1, "设备 ID 不能为空"),
        email: z.string().email("邮箱格式不正确").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 在当前 App 范围内查找设备
      const existing = await ctx.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.appId, ctx.app.id),
            eq(users.deviceId, input.deviceId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          user: existing[0],
          isNew: false,
          message: "设备已注册，欢迎回来",
        };
      }

      // 在当前 App 下创建新用户
      const [newUser] = await ctx.db
        .insert(users)
        .values({
          appId: ctx.app.id,
          deviceId: input.deviceId,
          email: input.email,
        })
        .returning();

      // 为新用户创建免费订阅
      await ctx.db.insert(subscriptions).values({
        userId: newUser.id,
        tier: "free",
        status: "active",
      });

      return {
        user: newUser,
        isNew: true,
        message: "注册成功",
      };
    }),

  /**
   * 刷新 Token
   */
  refresh: protectedProcedure.mutation(async ({ ctx }) => {
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
      return { success: false, message: "用户不存在" };
    }

    // TODO: 生成新的 JWT Token
    return {
      success: true,
      token: "placeholder-token",
      message: "Token 刷新成功",
    };
  }),

  /**
   * 获取当前用户信息（含订阅状态）
   */
  me: protectedProcedure.query(async ({ ctx }) => {
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
      return null;
    }

    const [sub] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    return {
      ...user,
      subscription: sub ?? null,
    };
  }),
});
