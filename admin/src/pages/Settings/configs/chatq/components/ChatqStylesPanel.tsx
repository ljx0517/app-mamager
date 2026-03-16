import { Card, Flex, Tag, Switch, Button } from 'antd'
import { SmileOutlined, RocketOutlined, HeartOutlined, FireOutlined, StarOutlined } from '@ant-design/icons'

const styleList = [
  {
    id: 'funny',
    name: '幽默风趣',
    description: '轻松搞笑的风格，带点俏皮和逗趣',
    icon: <SmileOutlined />,
    color: 'gold',
  },
  {
    id: 'professional',
    name: '专业正式',
    description: '商务场合适用，保持礼貌和专业',
    icon: <RocketOutlined />,
    color: 'blue',
  },
  {
    id: 'friendly',
    name: '友好亲切',
    description: '日常聊天首选，像朋友聊天一样',
    icon: <HeartOutlined />,
    color: 'green',
  },
  {
    id: 'humor',
    name: '轻松搞笑',
    description: '幽默段子风格，让对方会心一笑',
    icon: <FireOutlined />,
    color: 'orange',
  },
  {
    id: 'emoji',
    name: 'Emoji 风格',
    description: '在回复中加入适量的 Emoji，使内容更生动',
    icon: <StarOutlined />,
    color: 'purple',
  },
]

/** ChatQ 回复风格面板组件的属性 */
interface ChatqStylesPanelProps {
  /** 表单值 */
  values?: Record<string, any>
  /** 值变化回调 */
  onChange?: (values: Record<string, any>) => void
}

/**
 * ChatQ 回复风格面板
 * 用于管理可用的回复风格
 */
export function ChatqStylesPanel({ values = {}, onChange }: ChatqStylesPanelProps) {
  // 获取已启用的风格，默认为全部启用
  const enabledStyles: Record<string, boolean> = values.enabledStyles || {
    funny: true,
    professional: true,
    friendly: true,
    humor: true,
    emoji: true,
  }

  // 处理开关变化
  const handleSwitchChange = (styleId: string, checked: boolean) => {
    onChange?.({
      ...values,
      enabledStyles: { ...enabledStyles, [styleId]: checked },
    })
  }

  return (
    <Card
      size="small"
      title="回复风格"
      extra={
        <Button type="link" size="small">
          管理风格
        </Button>
      }
    >
      <Flex vertical gap={12}>
        {styleList.map((item) => (
          <Flex
            key={item.id}
            align="center"
            justify="space-between"
            style={{ padding: '12px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}
          >
            <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
              <Tag color={item.color} style={{ fontSize: 16, padding: '4px 8px' }}>
                {item.icon}
              </Tag>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>{item.description}</div>
              </div>
            </Flex>
            <Switch
              checked={enabledStyles[item.id] !== false}
              onChange={(checked) => handleSwitchChange(item.id, checked)}
              size="small"
            />
          </Flex>
        ))}
      </Flex>
    </Card>
  )
}
