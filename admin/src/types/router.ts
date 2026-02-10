import { initTRPC } from '@trpc/server'

/**
 * 服务端 AppRouter 类型
 *
 * 在服务端（server/）完成 tRPC Router 开发后，
 * 将此文件替换为从服务端导入的真实类型：
 *
 * ```ts
 * export type { AppRouter } from '../../server/src/router'
 * ```
 *
 * 当前使用空 Router 占位，确保前端可以正常编译。
 */

const t = initTRPC.create()

const appRouter = t.router({})

export type AppRouter = typeof appRouter
