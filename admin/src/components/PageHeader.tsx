import { Breadcrumb, theme } from 'antd'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface BreadcrumbItem {
  title: string
  path?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  extra?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  extra,
}: PageHeaderProps) {
  const { token } = theme.useToken()

  const breadcrumbItems = [
    { title: <Link to="/">首页</Link> },
    ...breadcrumbs.map((item) => ({
      title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title,
    })),
  ]

  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbItems} className="mb-3" />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold m-0"
            style={{ color: token.colorText }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1 mb-0 text-sm"
              style={{ color: token.colorTextSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {extra && <div className="flex items-center gap-3">{extra}</div>}
      </div>
    </div>
  )
}
