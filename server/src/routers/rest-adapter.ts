import { FastifyInstance } from "fastify";
import { TRPCError } from "@trpc/server";
import { createCallerFactory } from "@trpc/server";
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
 * 创建 tRPC 调用器
 */
async function createTRPCCaller(req: any, res: any) {
  const context = await createContext({ req, res });

  // 使用 createCallerFactory 创建调用器
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller(context);

  return caller;
}

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.mutation("subscription.verify", request.body);

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.query("subscription.status");

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.mutation("subscription.restore", request.body);

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.mutation("ai.generate", request.body);

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.query("ai.models");

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.mutation("user.register", request.body);

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
      const caller = await createTRPCCaller(request, reply);
      const result = await caller.mutation("user.refresh");

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