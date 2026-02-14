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
  const err = error as any

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
    // 调试日志
    loggerLink({
      enabled: (opts) => {
        // 只在错误时显示日志
        return opts.direction === 'down' && opts.result instanceof Error
      },
    }),
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
      // 全局错误处理 - 通过 fetch 包装
      async fetch(url, options) {
        try {
          const response = await fetch(url, options)

          // 如果响应状态不是 2xx，抛出错误
          if (!response.ok) {
            let errorMsg = `请求失败 (${response.status})`

            try {
              const errorData = await response.json()
              errorMsg = getErrorMessage(errorData)
            } catch {
              // 不是 JSON 响应，使用默认消息
            }

            message.error(errorMsg)
          }

          return response
        } catch (error) {
          // 网络错误
          message.error(getErrorMessage(error))
          throw error
        }
      },
    }),
  ],
})

// 导出错误处理函数，供各页面使用
export { getErrorMessage }
