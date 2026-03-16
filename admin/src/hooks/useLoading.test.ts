import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLoading, useQueryLoading, useMutationLoading, useSmartLoading } from '@/hooks/useLoading'

describe('useLoading hook', () => {
  it('所有状态为 false 时返回 false', () => {
    const { result } = renderHook(() => useLoading(false, false, false))
    expect(result.current).toBe(false)
  })

  it('任一状态为 true 时返回 true', () => {
    const { result } = renderHook(() => useLoading(false, true, false))
    expect(result.current).toBe(true)
  })

  it('所有状态为 true 时返回 true', () => {
    const { result } = renderHook(() => useLoading(true, true, true))
    expect(result.current).toBe(true)
  })

  it('空参数时返回 false', () => {
    const { result } = renderHook(() => useLoading())
    expect(result.current).toBe(false)
  })
})

describe('useQueryLoading hook', () => {
  it('所有 query 未加载时返回 false', () => {
    const queries = [
      { isLoading: false, isFetching: false },
      { isLoading: false, isFetching: false },
    ]
    const { result } = renderHook(() => useQueryLoading(...queries))
    expect(result.current).toBe(false)
  })

  it('任一 query 加载中时返回 true', () => {
    const queries = [
      { isLoading: false, isFetching: false },
      { isLoading: true, isFetching: false },
    ]
    const { result } = renderHook(() => useQueryLoading(...queries))
    expect(result.current).toBe(true)
  })

  it('任一 query 获取中时返回 true', () => {
    const queries = [
      { isLoading: false, isFetching: false },
      { isLoading: false, isFetching: true },
    ]
    const { result } = renderHook(() => useQueryLoading(...queries))
    expect(result.current).toBe(true)
  })
})

describe('useMutationLoading hook', () => {
  it('所有 mutation 未处理时返回 false', () => {
    const mutations = [
      { isPending: false },
      { isPending: false },
    ]
    const { result } = renderHook(() => useMutationLoading(...mutations))
    expect(result.current).toBe(false)
  })

  it('任一 mutation 处理中时返回 true', () => {
    const mutations = [
      { isPending: false },
      { isPending: true },
    ]
    const { result } = renderHook(() => useMutationLoading(...mutations))
    expect(result.current).toBe(true)
  })
})

describe('useSmartLoading hook', () => {
  it('所有状态为 false 时返回 false', () => {
    const { result } = renderHook(() =>
      useSmartLoading({
        queries: [{ isLoading: false, isFetching: false }],
        mutations: [{ isPending: false }],
        manualStates: [false],
      })
    )
    expect(result.current).toBe(false)
  })

  it('query 加载中时返回 true', () => {
    const { result } = renderHook(() =>
      useSmartLoading({
        queries: [{ isLoading: true, isFetching: false }],
        mutations: [{ isPending: false }],
        manualStates: [false],
      })
    )
    expect(result.current).toBe(true)
  })

  it('mutation 处理中时返回 true', () => {
    const { result } = renderHook(() =>
      useSmartLoading({
        queries: [{ isLoading: false, isFetching: false }],
        mutations: [{ isPending: true }],
        manualStates: [false],
      })
    )
    expect(result.current).toBe(true)
  })

  it('手动状态为 true 时返回 true', () => {
    const { result } = renderHook(() =>
      useSmartLoading({
        queries: [{ isLoading: false, isFetching: false }],
        mutations: [{ isPending: false }],
        manualStates: [true],
      })
    )
    expect(result.current).toBe(true)
  })

  it('空配置时返回 false', () => {
    const { result } = renderHook(() => useSmartLoading({}))
    expect(result.current).toBe(false)
  })
})
