import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc/index.js";
import { admins } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../utils/crypto.js";
import { generateAdminToken } from "../utils/jwt.js";
import { TRPCError } from "@trpc/server";

/**
 * 管理员路由
 * 处理管理员注册、登录、信息查询
 */
export const adminRouter = router({
  /**
   * 管理员登录
   * 返回简易 Token（后续可升级为 JWT）
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "用户名不能为空"),
        password: z.string().min(6, "密码至少 6 位"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [admin] = await ctx.db
        .select()
        .from(admins)
        .where(eq(admins.username, input.username))
        .limit(1);

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "用户名或密码错误",
        });
      }

      const valid = await verifyPassword(input.password, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "用户名或密码错误",
        });
      }

      // 生成 JWT Token
      const token = generateAdminToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        tokenVersion: admin.tokenVersion,
      });

      return {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      };
    }),

  /**
   * 创建管理员（仅 super_admin 可操作）
   */
  create: adminProcedure
    .input(
      z.object({
        username: z.string().min(2).max(50),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["super_admin", "admin"]).optional().default("admin"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 仅 super_admin 可创建管理员
      if (ctx.admin.role !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "仅超级管理员可创建新管理员",
        });
      }

      const passwordHash = await hashPassword(input.password);

      const [newAdmin] = await ctx.db
        .insert(admins)
        .values({
          username: input.username,
          email: input.email,
          passwordHash,
          role: input.role,
        })
        .returning({
          id: admins.id,
          username: admins.username,
          email: admins.email,
          role: admins.role,
          tokenVersion: admins.tokenVersion,
          createdAt: admins.createdAt,
        });

      return { admin: newAdmin, message: "管理员创建成功" };
    }),

  /**
   * 获取当前管理员信息
   */
  me: adminProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.admin.id,
      username: ctx.admin.username,
      email: ctx.admin.email,
      role: ctx.admin.role,
      createdAt: ctx.admin.createdAt,
    };
  }),

  /**
   * 刷新管理员 Token
   * 验证当前 Token 并生成新的 Token
   */
  refresh: adminProcedure.mutation(async ({ ctx }) => {
    const newToken = generateAdminToken({
      id: ctx.admin.id,
      username: ctx.admin.username,
      email: ctx.admin.email,
      role: ctx.admin.role,
      tokenVersion: ctx.admin.tokenVersion,
    });

    return {
      token: newToken,
      admin: {
        id: ctx.admin.id,
        username: ctx.admin.username,
        email: ctx.admin.email,
        role: ctx.admin.role,
      },
      message: "Token 刷新成功",
    };
  }),

  /**
   * 初始化 - 创建首个超级管理员（仅当系统无管理员时可用）
   */
  init: publicProcedure
    .input(
      z.object({
        username: z.string().min(2).max(50),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否已有管理员
      const existing = await ctx.db.select().from(admins).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "系统已初始化，请通过管理员登录",
        });
      }

      const passwordHash = await hashPassword(input.password);

      const [superAdmin] = await ctx.db
        .insert(admins)
        .values({
          username: input.username,
          email: input.email,
          passwordHash,
          role: "super_admin",
        })
        .returning({
          id: admins.id,
          username: admins.username,
          email: admins.email,
          role: admins.role,
          tokenVersion: admins.tokenVersion,
          createdAt: admins.createdAt,
        });

      const token = generateAdminToken({
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
        tokenVersion: superAdmin.tokenVersion,
      });

      return {
        admin: superAdmin,
        token,
        message: "超级管理员创建成功，请妥善保管登录凭证",
      };
    }),
});
