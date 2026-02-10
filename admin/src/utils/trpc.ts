import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from '@/types/router'

/**
 * tRPC React 客户端
 * 通过 createTRPCReact 创建，提供类型安全的 API 调用 hooks
 */
export const trpc = createTRPCReact<AppRouter>()

/**
 * React Query 客户端
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
})

/**
 * tRPC 客户端实例
 * 配置 HTTP 批量请求链接，自动附带认证 Token 和当前 App ID
 */
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        const token = localStorage.getItem('admin_token')

        // 从 Zustand 持久化存储中读取当前 App ID
        let appId: string | null = null
        try {
          const stored = localStorage.getItem('admin-app')
          if (stored) {
            const parsed = JSON.parse(stored)
            appId = parsed?.state?.currentAppId ?? null
          }
        } catch {
          // ignore
        }

        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(appId ? { 'x-app-id': appId } : {}),
        }
      },
    }),
  ],
})
