import { Card, Statistic, theme } from 'antd'
import type { ReactNode } from 'react'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface StatsCardProps {
  title: string
  value: number | string
  prefix?: ReactNode
  suffix?: string
  precision?: number
  trend?: number // 正数为上升，负数为下降
  icon?: ReactNode
  color?: string
  loading?: boolean
}

export default function StatsCard({
  title,
  value,
  prefix,
  suffix,
  precision,
  trend,
  icon,
  color = '#1677ff',
  loading = false,
}: StatsCardProps) {
  const { token } = theme.useToken()

  return (
    <Card
      loading={loading}
      hoverable
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Statistic
            title={
              <span style={{ color: token.colorTextSecondary, fontSize: 14 }}>
                {title}
              </span>
            }
            value={value}
            prefix={prefix}
            suffix={suffix}
            precision={precision}
            styles={{ content: { fontWeight: 600, fontSize: 28 } }}
          />

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              {trend >= 0 ? (
                <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12 }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
              )}
              <span
                style={{ color: trend >= 0 ? '#52c41a' : '#ff4d4f' }}
              >
                {Math.abs(trend)}%
              </span>
              <span style={{ color: token.colorTextDescription }}>
                较上月
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              backgroundColor: `${color}15`,
              color,
              fontSize: 22,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
