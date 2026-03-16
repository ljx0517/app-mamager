import { Card, Switch, Space, Typography, Divider } from 'antd'
import { BulbOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

/** ChatQ 功能面板组件的属性 */
interface ChatqFeaturePanelProps {
  /** 表单值 */
  values?: Record<string, any>
  /** 值变化回调 */
  onChange?: (values: Record<string, any>) => void
}

/**
 * ChatQ 功能面板组件
 * 用于配置 ChatQ 核心功能开关
 */
export function ChatqFeaturePanel({ values = {}, onChange }: ChatqFeaturePanelProps) {
  // 功能开关配置
  const features = [
    { key: 'enableCustomReply', name: '自定义回复', description: 'AI 生成不同风格的回复' },
    { key: 'enableKeywordReply', name: '关键词自动回复', description: '根据关键词匹配自动回复' },
    { key: 'enableQuickPhrases', name: '快捷短语', description: '保存常用短语快速输入' },
    { key: 'enableContextAware', name: '上下文感知', description: '理解对话上下文生成更准确的回复' },
    { key: 'enableAISmartAdjust', name: 'AI 智能调整', description: '根据对话自动调整人设标签权重（默认关闭，Local-First）' },
  ]

  // 处理开关变化
  const handleSwitchChange = (key: string, checked: boolean) => {
    onChange?.({ ...values, [key]: checked })
  }

  return (
    <Card size="small" title={<><BulbOutlined /> 功能开关</>}>
      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
        {features.map((feature, index) => (
          <div key={feature.key}>
            {index > 0 && <Divider style={{ margin: '8px 0' }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{feature.name}</Text>
                <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
                  {feature.description}
                </Paragraph>
              </div>
              <Switch
                checked={feature.key === 'enableAISmartAdjust' ? values[feature.key] === true : values[feature.key] !== false}
                onChange={(checked) => handleSwitchChange(feature.key, checked)}
              />
            </div>
          </div>
        ))}
      </Space>
    </Card>
  )
}
