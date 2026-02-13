import { useMemo } from 'react'

/**
 * 组合多个加载状态，返回整体加载状态
 * 适用于同时监控多个异步操作的情况
 */
export function useLoading(...loadingStates: boolean[]): boolean {
  return useMemo(
    () => loadingStates.some((state) => state),
    [loadingStates],
  )
}

/**
 * 使用React Query的loading状态
 * 组合多个queries和mutations的loading状态
 */
export function useQueryLoading(...queries: Array<{ isLoading?: boolean; isFetching?: boolean }>): boolean {
  return useMemo(
    () => queries.some((query) => query.isLoading || query.isFetching),
    [queries],
  )
}

/**
 * 使用React Query的pending状态（用于mutations）
 */
export function useMutationLoading(...mutations: Array<{ isPending?: boolean }>): boolean {
  return useMemo(
    () => mutations.some((mutation) => mutation.isPending),
    [mutations],
  )
}

/**
 * 智能加载状态管理
 * 同时处理查询和变更操作的加载状态
 */
export function useSmartLoading(options: {
  queries?: Array<{ isLoading?: boolean; isFetching?: boolean }>
  mutations?: Array<{ isPending?: boolean }>
  manualStates?: boolean[]
}): boolean {
  const { queries = [], mutations = [], manualStates = [] } = options

  const queryLoading = useQueryLoading(...queries)
  const mutationLoading = useMutationLoading(...mutations)
  const manualLoading = useLoading(...manualStates)

  return useMemo(
    () => queryLoading || mutationLoading || manualLoading,
    [queryLoading, mutationLoading, manualLoading],
  )
}