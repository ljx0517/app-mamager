import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 环境变量未设置");
}

/** postgres.js 查询客户端 */
const queryClient = postgres(connectionString);

/** Drizzle ORM 实例（附带 schema 用于关系查询） */
export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
