import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from 'app-manager-server'
import { message } from 'antd'

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
 * 从 tRPC 错误中提取用户友好的错误信息
 */
function getErrorMessage(error: unknown): string {
  const err = error as { data?: { code?: string; message?: string }; message?: string }

  // tRPC 错误结构
  if (err?.data?.code === 'UNAUTHORIZED') {
    return '认证失败，请重新登录'
  }
  if (err?.data?.code === 'FORBIDDEN') {
    return '权限不足，无法执行此操作'
  }
  if (err?.data?.code === 'NOT_FOUND') {
    return '请求的资源不存在'
  }
  if (err?.data?.code === 'BAD_REQUEST') {
    return err?.data?.message || '请求参数错误'
  }
  if (err?.data?.code === 'TIMEOUT') {
    return '请求超时，请稍后重试'
  }
  if (err?.data?.code === 'INTERNAL_SERVER_ERROR') {
    return '服务器内部错误，请联系管理员'
  }

  // 网络错误
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return '网络连接失败，请检查网络设置'
  }

  // 默认错误消息
  return err?.message || err?.data?.message || '操作失败，请稍后重试'
}

/**
 * tRPC 客户端实例
 * 配置 HTTP 批量请求链接，自动附带认证 Token 和当前 App ID
 */
export const trpcClient = trpc.createClient({
  links: [
    // 日志链路 - 记录所有请求
    loggerLink({
      console: {
        log: (args) => console.log('[tRPC]', ...args),
        error: (args) => console.error('[tRPC Error]', ...args),
      },
    }),
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        const token = localStorage.getItem('admin_token')
        console.log('[trpc headers] token:', token ? '存在' : '不存在')

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

/**
 * 全局错误处理配置
 * 使用 mutation 的 onError 回调处理错误
 * 此函数可在需要全局错误处理的地方调用
 */
export function setupGlobalErrorHandler() {
  // 设置全局 mutation 错误处理
  // 通过覆盖 queryClient 的默认错误处理来实现
  const originalHandleQueryResult = queryClient.getDefaultOptions().queries?.onError

  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: {
      ...queryClient.getDefaultOptions().queries,
      onError: (error) => {
        console.error('[Query Error]', error)
        message.error(getErrorMessage(error))
        originalHandleQueryResult?.(error)
      },
    },
    mutations: {
      ...queryClient.getDefaultOptions().mutations,
      onError: (error) => {
        console.error('[Mutation Error]', error)
        message.error(getErrorMessage(error))
      },
    },
  })
}
