import { FastifyInstance } from "fastify";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../trpc/router.js";
import { createContext } from "../trpc/context.js";

/**
 * REST 到 tRPC 适配层
 *
 * 移动端使用 REST API 路径（/api/*），但服务端使用 tRPC 路径（/trpc/*）。
 * 此适配层将 REST 请求转换为 tRPC 调用，保持移动端接口不变。
 *
 * 路由映射：
 * - POST /api/subscription/verify → subscription.verify (protected)
 * - GET  /api/subscription/status → subscription.status (protected)
 * - POST /api/subscription/restore → subscription.restore (protected)
 * - POST /api/ai/generate → ai.generate (protected)
 * - GET  /api/ai/models → ai.models (protected)
 * - POST /api/user/register → user.register (app)
 * - POST /api/user/refresh → user.refresh (protected)
 * - POST /api/user/login → user.loginWithEmail (app)
 * - GET  /api/user/me → user.me (protected)
 * - POST /api/user/register-with-email → user.registerWithEmail (app)
 */

/**
 * 错误映射：将 tRPC 错误转换为 HTTP 状态码
 */
function mapTRPCErrorToHTTP(error: TRPCError): { statusCode: number; message: string } {
  switch (error.code) {
    case "UNAUTHORIZED":
      return { statusCode: 401, message: error.message };
    case "FORBIDDEN":
      return { statusCode: 403, message: error.message };
    case "NOT_FOUND":
      return { statusCode: 404, message: error.message };
    case "BAD_REQUEST":
      return { statusCode: 400, message: error.message };
    case "TOO_MANY_REQUESTS":
      return { statusCode: 429, message: error.message };
    case "CONFLICT":
      return { statusCode: 409, message: error.message };
    case "INTERNAL_SERVER_ERROR":
      return { statusCode: 500, message: error.message };
    default:
      return { statusCode: 500, message: "Internal server error" };
  }
}

/**
 * 简单的 REST 到 tRPC 转发器
 * 实际上，我们可以直接使用现有的 tRPC 端点
 * 但为了保持 REST 路径，我们创建一个简单的转发层
 *
 * 注意：这是一个简化实现，实际生产环境需要更完善的错误处理和类型安全
 */

// 由于直接调用 tRPC 内部方法比较复杂，我们采用简化方案
// 在实际部署中，可以考虑使用反向代理或更完善的适配器

/**
 * 注册 REST 适配层路由
 */
export async function registerRestAdapter(server: FastifyInstance) {
  // ==================== 订阅相关路由 ====================

  /**
   * POST /api/subscription/verify
   * 验证 App Store / Google Play 收据
   */
  server.post("/api/subscription/verify", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "subscription.verify", request.body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("Subscription verify error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * GET /api/subscription/status
   * 查询当前用户订阅状态
   */
  server.get("/api/subscription/status", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "subscription.status");
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("Subscription status error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * POST /api/subscription/restore
   * 恢复购买
   */
  server.post("/api/subscription/restore", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "subscription.restore", request.body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("Subscription restore error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  // ==================== AI 相关路由 ====================

  /**
   * POST /api/ai/generate
   * 生成 AI 回复
   */
  server.post("/api/ai/generate", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "ai.generate", request.body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("AI generate error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * GET /api/ai/models
   * 获取可用的 AI 模型列表
   */
  server.get("/api/ai/models", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "ai.models");
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("AI models error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  // ==================== 用户相关路由 ====================

  /**
   * POST /api/user/register
   * 设备注册
   */
  server.post("/api/user/register", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "user.register", request.body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("User register error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * POST /api/user/refresh
   * 刷新 Token
   */
  server.post("/api/user/refresh", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "user.refresh");
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("User refresh error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * POST /api/user/login
   * 邮箱密码登录
   */
  server.post("/api/user/login", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "user.loginWithEmail", request.body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("User login error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * GET /api/user/me
   * 获取当前用户信息
   */
  server.get("/api/user/me", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "user.me");
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("User me error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  /**
   * POST /api/user/register-with-email
   * 邮箱注册
   */
  server.post("/api/user/register-with-email", async (request, reply) => {
    try {
      const result = await callTRPCProcedure(server, request, "user.registerWithEmail", request.body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        const { statusCode, message } = mapTRPCErrorToHTTP(error);
        return reply.status(statusCode).send({
          success: false,
          error: {
            code: error.code,
            message,
          },
        });
      }

      console.error("User register with email error:", error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  });

  // ==================== 健康检查 ====================

  /**
   * GET /api/health
   * REST 适配层健康检查
   */
  server.get("/api/health", async (request, reply) => {
    return reply.status(200).send({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "REST Adapter Layer",
      version: "1.0.0",
    });
  });

  console.log("REST 适配层路由注册完成");
}