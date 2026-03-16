import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('PageHeader 组件', () => {
  it('渲染标题', () => {
    renderWithRouter(<PageHeader title="测试标题" />)
    expect(screen.getByText('测试标题')).toBeTruthy()
  })

  it('渲染副标题', () => {
    renderWithRouter(<PageHeader title="标题" subtitle="副标题" />)
    expect(screen.getByText('副标题')).toBeTruthy()
  })

  it('不显示副标题时没有副标题元素', () => {
    const { container } = renderWithRouter(<PageHeader title="标题" />)
    const subtitle = container.querySelector('p')
    expect(subtitle).toBeNull()
  })

  it('渲染面包屑导航', () => {
    const breadcrumbs = [
      { title: '设置', path: '/settings' },
      { title: '系统配置' },
    ]
    renderWithRouter(<PageHeader title="标题" breadcrumbs={breadcrumbs} />)
    expect(screen.getByText('设置')).toBeTruthy()
    expect(screen.getByText('系统配置')).toBeTruthy()
  })

  it('渲染额外内容', () => {
    const { container } = renderWithRouter(
      <PageHeader title="标题" extra={<button>操作</button>} />
    )
    expect(container.querySelector('button')).toBeTruthy()
  })

  it('无面包屑时不渲染面包屑组件', () => {
    const { container } = renderWithRouter(<PageHeader title="标题" />)
    expect(container.querySelector('.ant-breadcrumb')).toBeNull()
  })
})
