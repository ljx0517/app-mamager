import "dotenv/config";
import fastify from "fastify";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { createContext } from "./trpc/context.js";
import { appRouter, type AppRouter } from "./trpc/router.js";
import { checkEmailConfig } from "./utils/email.js";

/**
 * 多 App 管理后台服务
 * 基于 Fastify + tRPC + Drizzle ORM + PostgreSQL
 */
async function main() {
  // 检查邮件服务配置
  checkEmailConfig();

  const server = fastify({
    maxParamLength: 5000,
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  // CORS 支持
  server.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    reply.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-api-key, x-device-id"
    );

    if (request.method === "OPTIONS") {
      reply.status(204).send();
    }
  });

  // 注册 tRPC 插件
  server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }) {
        console.error(`tRPC Error [${path}]:`, error.message);
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  // 健康检查端点
  server.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Multi-App Management Server",
      version: "0.6.0",
    };
  });

  // 注册 Webhook 路由
  server.register(async (fastify) => {
    // Apple Store Server Notifications V2 Webhook
    const appleWebhook = await import("./routers/webhook.js");
    fastify.register(appleWebhook.default, { prefix: "/webhook" });
  });

  // 启动服务
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "0.0.0.0";

  try {
    await server.listen({ port, host });
    console.log(`
╔═══════════════════════════════════════════════════╗
║        Multi-App Management Server                ║
╠═══════════════════════════════════════════════════╣
║  地址:   http://${host}:${port}                     ║
║  tRPC:   http://${host}:${port}/trpc                ║
║  健康:   http://${host}:${port}/health              ║
╠═══════════════════════════════════════════════════╣
║  管理后台:  admin.* / app.*                        ║
║  客户端:    user.* / ai.* / style.* / subscription.*║
╚═══════════════════════════════════════════════════╝
    `);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
