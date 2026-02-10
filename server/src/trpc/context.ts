import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { apps, type App } from "../db/schema.js";

/**
 * tRPC 请求上下文（多租户版）
 *
 * 认证模型：
 *  - 客户端 App 通过 x-api-key 请求头标识自己属于哪个 App
 *  - 客户端 App 通过 x-device-id 请求头标识用户设备
 *  - 管理后台通过 Authorization: Bearer <token> 进行管理员认证
 */
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const deviceId = req.headers["x-device-id"] as string | undefined;
  const authorization = req.headers.authorization;

  // 如果携带了 API Key，尝试解析对应的 App
  let app: App | null = null;
  if (apiKey) {
    const [found] = await db
      .select()
      .from(apps)
      .where(eq(apps.apiKey, apiKey))
      .limit(1);
    app = found ?? null;
  }

  return {
    req,
    res,
    db,
    /** 客户端 App 实例（通过 x-api-key 解析） */
    app,
    /** 客户端设备标识 */
    deviceId,
    /** 管理员 Authorization header */
    authorization,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
