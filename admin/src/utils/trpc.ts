import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink, type TRPCLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from '@/types/router'
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
 * 错误处理中间件
 * 统一处理 API 错误，显示用户友好的错误提示
 */
const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return next(op).catch((error) => {
      // 提取用户友好的错误信息
      const errorMessage = getErrorMessage(error)

      // 显示错误提示（生产环境可考虑更优雅的UI）
      if (shouldShowErrorMessage(op)) {
        message.error(errorMessage)
      }

      // 继续传递错误，让调用方可以处理
      throw error
    })
  }
}

/**
 * 从 tRPC 错误中提取用户友好的错误信息
 */
function getErrorMessage(error: any): string {
  // tRPC 错误结构
  if (error?.data?.code === 'UNAUTHORIZED') {
    return '认证失败，请重新登录'
  }
  if (error?.data?.code === 'FORBIDDEN') {
    return '权限不足，无法执行此操作'
  }
  if (error?.data?.code === 'NOT_FOUND') {
    return '请求的资源不存在'
  }
  if (error?.data?.code === 'BAD_REQUEST') {
    return error?.data?.message || '请求参数错误'
  }
  if (error?.data?.code === 'TIMEOUT') {
    return '请求超时，请稍后重试'
  }
  if (error?.data?.code === 'INTERNAL_SERVER_ERROR') {
    return '服务器内部错误，请联系管理员'
  }

  // 网络错误
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '网络连接失败，请检查网络设置'
  }

  // 默认错误消息
  return error?.message || error?.data?.message || '操作失败，请稍后重试'
}

/**
 * 判断是否应该显示错误消息
 * 某些操作（如后台轮询）可能不希望显示错误提示
 */
function shouldShowErrorMessage(op: any): boolean {
  // 可以根据操作类型决定是否显示错误
  // 例如：查询错误可能不需要显示，而变更操作应该显示
  return true // 暂时全部显示
}

/**
 * tRPC 客户端实例
 * 配置 HTTP 批量请求链接，自动附带认证 Token 和当前 App ID
 */
export const trpcClient = trpc.createClient({
  links: [
    errorHandlingLink,
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
