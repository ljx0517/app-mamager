import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/**
 * 密码哈希 - 使用 Node.js 内置 scrypt（零外部依赖）
 * 输出格式: salt:hash（均为 hex 编码）
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuffer = Buffer.from(hash, "hex");
  return timingSafeEqual(derivedKey, hashBuffer);
}

/**
 * 生成 API Key（32 字节 = 64 字符 hex）
 */
export function generateApiKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 生成 API Secret（64 字节 = 128 字符 hex）
 */
export function generateApiSecret(): string {
  return randomBytes(64).toString("hex");
}
