import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { Context } from "./context.js";
import { admins } from "../db/schema.js";

/**
 * tRPC 初始化（多租户版）
 *
 * Procedure 层级：
 *  publicProcedure    → 无需任何认证
 *  appProcedure       → 需要有效的 x-api-key（客户端 App 级别）
 *  protectedProcedure → 需要 x-api-key + x-device-id（客户端用户级别）
 *  adminProcedure     → 需要管理员 JWT 认证（管理后台）
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

/** 创建路由 */
export const router = t.router;

/** 公开 procedure（无需认证） */
export const publicProcedure = t.procedure;

/**
 * App 级别 procedure
 * 要求请求携带有效的 x-api-key，解析出对应的 App
 */
export const appProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.app) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "无效的 API Key，请在请求头中携带有效的 x-api-key",
    });
  }

  if (!ctx.app.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "该应用已被禁用，请联系管理员",
    });
  }

  return next({
    ctx: {
      ...ctx,
      app: ctx.app,
    },
  });
});

/**
 * 用户级别 procedure（需要 App 认证 + 设备标识）
 * 客户端 App 的用户请求必须同时携带 x-api-key 和 x-device-id
 */
export const protectedProcedure = appProcedure.use(async ({ ctx, next }) => {
  if (!ctx.deviceId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "缺少设备标识，请在请求头中携带 x-device-id",
    });
  }

  return next({
    ctx: {
      ...ctx,
      deviceId: ctx.deviceId,
    },
  });
});

/**
 * 管理员 procedure
 * 管理后台请求需要 Authorization: Bearer <admin_token>
 * 当前使用简易 Token 方案，后续可升级为 JWT
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.authorization) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "缺少管理员认证，请在请求头中携带 Authorization",
    });
  }

  const token = ctx.authorization.replace("Bearer ", "");

  // 简易方案：Token 格式为 admin:<id>
  // 后续可替换为 JWT 验签
  if (!token.startsWith("admin:")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "无效的管理员 Token",
    });
  }

  const adminId = token.replace("admin:", "");
  const [admin] = await ctx.db
    .select()
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  if (!admin) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "管理员不存在或 Token 已失效",
    });
  }

  return next({
    ctx: {
      ...ctx,
      admin,
    },
  });
});
