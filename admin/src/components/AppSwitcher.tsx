import { Select, Tag, theme } from 'antd'
import { useAppStore } from '@/stores/appStore'
import type { AppStatus } from '@/types'

/** App 状态颜色映射 */
const STATUS_COLORS: Record<AppStatus, string> = {
  active: 'green',
  inactive: 'default',
  maintenance: 'orange',
  archived: 'red',
}

/** App 状态标签 */
const STATUS_LABELS: Record<AppStatus, string> = {
  active: '运行中',
  inactive: '未激活',
  maintenance: '维护中',
  archived: '已归档',
}

interface AppSwitcherProps {
  collapsed?: boolean
}

export default function AppSwitcher({ collapsed = false }: AppSwitcherProps) {
  const { apps, currentAppId, setCurrentApp } = useAppStore()
  const { token } = theme.useToken()

  const currentApp = apps.find((app) => app.id === currentAppId)

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
    </div>
  )
}
