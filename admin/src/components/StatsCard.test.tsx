import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsCard from '@/components/StatsCard'

describe('StatsCard 组件', () => {
  it('渲染标题', () => {
    render(<StatsCard title="用户数" value={1000} />)
    expect(screen.getByText('用户数')).toBeTruthy()
  })

  it('渲染数值', () => {
    render(<StatsCard title="用户数" value={1000} />)
    // Ant Design Statistic 可能将数字拆分渲染
    expect(screen.getByText('1,000')).toBeTruthy()
  })

  it('渲染后缀', () => {
    render(<StatsCard title="金额" value={1000} suffix="元" />)
    expect(screen.getByText('元')).toBeTruthy()
  })

  it('trend > 0 显示上升趋势', () => {
    const { container } = render(<StatsCard title="用户数" value={100} trend={10} />)
    expect(container.querySelector('.anticon-arrow-up')).toBeTruthy()
  })

  it('trend < 0 显示下降趋势', () => {
    const { container } = render(<StatsCard title="用户数" value={100} trend={-5} />)
    expect(container.querySelector('.anticon-arrow-down')).toBeTruthy()
  })

  it('loading=true 显示加载状态', () => {
    const { container } = render(<StatsCard title="用户数" value={100} loading />)
    expect(container.querySelector('.ant-card-loading')).toBeTruthy()
  })
})
