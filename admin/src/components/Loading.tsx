import { Spin, Skeleton, Space, theme } from 'antd'
import type { SpinProps } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface LoadingProps {
  /** 加载状态 */
  loading?: boolean
  /** 加载提示文本 */
  tip?: string
  /** 是否显示为骨架屏（用于内容占位） */
  skeleton?: boolean
  /** 骨架屏行数 */
  rows?: number
  /** 是否全屏居中显示 */
  fullScreen?: boolean
  /** 是否内联显示（不阻塞页面） */
  inline?: boolean
  /** 自定义Spin属性 */
  spinProps?: SpinProps
}

/**
 * 统一加载状态组件
 * 支持多种加载场景：全屏加载、内联加载、骨架屏占位
 */
export default function Loading({
  loading = true,
  tip = '加载中...',
  skeleton = false,
  rows = 3,
  fullScreen = false,
  inline = false,
  spinProps,
}: LoadingProps) {
  const { token } = theme.useToken()

  if (skeleton) {
    return <Skeleton active paragraph={{ rows }} />
  }

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000,
        }}
      >
        <Spin
          tip={tip}
          size="large"
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          {...spinProps}
        />
      </div>
    )
  }

  if (inline) {
    return (
      <Space size="middle">
        <Spin size="small" />
        <span style={{ color: token.colorTextSecondary }}>{tip}</span>
      </Space>
    )
  }

  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <Spin tip={tip} size="large" {...spinProps} />
    </div>
  )
}

/**
 * 页面加载组件 - 专为页面初始加载设计
 */
export function PageLoading() {
  return <Loading fullScreen tip="页面加载中..." />
}

/**
 * 内容加载组件 - 用于内容区域的骨架屏
 */
export function ContentLoading({ rows = 3 }: { rows?: number }) {
  return <Loading skeleton rows={rows} />
}

/**
 * 表格加载组件 - 专为表格数据加载设计
 */
export function TableLoading() {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <Spin tip="数据加载中..." size="large" />
    </div>
  )
}