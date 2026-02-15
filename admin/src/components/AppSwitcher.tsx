import { Select, Tag, theme, Spin } from 'antd'
import { useAppStore } from '@/stores/appStore'
import type { AppStatus } from '@/types'

interface AppSwitcherProps {
  collapsed?: boolean
  loading?: boolean
  error?: Error | null
}

export default function AppSwitcher({ collapsed = false, loading = false, error = null }: AppSwitcherProps) {
  const { apps, currentAppId, setCurrentApp } = useAppStore()
  const { token } = theme.useToken()

  // 调试：打印 apps 数组
  console.log('[AppSwitcher] apps:', apps, 'loading:', loading, 'error:', error)

  const currentApp = apps.find((app) => app.id === currentAppId)

  // 状态颜色映射
  const STATUS_COLORS: Record<AppStatus, string> = {
    active: 'green',
    inactive: 'default',
    maintenance: 'orange',
    archived: 'red',
  }

  // 状态标签映射
  const STATUS_LABELS: Record<AppStatus, string> = {
    active: '运行中',
    inactive: '未激活',
    maintenance: '维护中',
    archived: '已归档',
  }

  if (collapsed) {
    // 收起状态：只显示当前 App 图标
    return (
      <div
        className="flex items-center justify-center cursor-pointer"
        style={{
          height: 56,
          padding: '8px 0',
        }}
        title={currentApp?.name ?? '选择 App'}
      >
        <span className="text-xl">{currentApp?.icon ?? '📱'}</span>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '12px 16px',
      }}
    >
      <div
        className="text-xs mb-1.5 font-medium"
        style={{ color: token.colorTextQuaternary, letterSpacing: 1 }}
      >
        当前应用
      </div>
      {loading ? (
        <div className="text-center py-2">
          <Spin size="small" />
        </div>
      ) : error ? (
        <div className="text-xs text-red-500 py-2">
          加载失败
        </div>
      ) : apps.length === 0 ? (
        <div className="text-xs text-gray-400 py-2">
          暂无应用
        </div>
      ) : (
        <Select
          value={currentAppId}
          onChange={setCurrentApp}
          style={{ width: '100%' }}
          size="middle"
          optionLabelProp="label"
          options={apps.map((app) => ({
            value: app.id,
            label: (
              <span className="flex items-center gap-2">
                <span>{app.icon}</span>
                <span>{app.name}</span>
              </span>
            ),
          }))}
          optionRender={(option) => {
            const app = apps.find((a) => a.id === option.value)
            if (!app) return null
            return (
              <div className="flex items-center justify-between py-0.5">
                <span className="flex items-center gap-2">
                  <span className="text-base">{app.icon}</span>
                  <span>{app.name}</span>
                </span>
                <Tag
                  color={STATUS_COLORS[app.status]}
                  style={{ marginRight: 0, fontSize: 11 }}
                >
                  {STATUS_LABELS[app.status]}
                </Tag>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
