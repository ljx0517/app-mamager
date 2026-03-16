import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PageLoading, ContentLoading, TableLoading } from '@/components/Loading'

// Mock Ant Design icons
vi.mock('@ant-design/icons', () => ({
  LoadingOutlined: () => 'LoadingOutlined',
}))

describe('PageLoading 组件', () => {
  it('渲染页面加载组件', () => {
    const { container } = render(<PageLoading />)
    expect(container.textContent).toContain('页面加载中')
  })
})

describe('ContentLoading 组件', () => {
  it('渲染内容加载骨架屏', () => {
    const { container } = render(<ContentLoading />)
    // Skeleton 组件会有 ant-skeleton 类
    expect(container.querySelector('.ant-skeleton')).toBeTruthy()
  })
})

describe('TableLoading 组件', () => {
  it('渲染表格加载状态', () => {
    const { container } = render(<TableLoading />)
    // Ant Spin 组件渲染 loading 状态
    expect(container.querySelector('.ant-spin')).toBeTruthy()
  })
})
