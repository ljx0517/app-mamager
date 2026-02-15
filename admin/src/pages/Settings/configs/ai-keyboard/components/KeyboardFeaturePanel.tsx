/**
 * 键盘功能面板 - AI Keyboard 专属组件
 * 用于配置键盘的核心功能
 */
import { Card, Row, Col, Switch, Typography, Space, Tag } from 'antd'
import {
  ThunderboltOutlined,
  MessageOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface FeatureItem {
  key: string
  icon: React.ReactNode
  label: string
  description: string
  beta?: boolean
}

const features: FeatureItem[] = [
  {
    key: 'aiReply',
    icon: <MessageOutlined />,
    label: 'AI 智能回复',
    description: '根据上下文智能生成回复内容',
  },
  {
    key: 'smartCompose',
    icon: <ThunderboltOutlined />,
    label: '智能写作',
    description: '辅助写作，提供句子补全和建议',
  },
  {
    key: 'customTheme',
    icon: <BgColorsOutlined />,
    label: '自定义主题',
    description: '允许用户自定义键盘外观主题',
  },
  {
    key: 'emojiPrediction',
    icon: <FontSizeOutlined />,
    label: 'Emoji 预测',
    description: '智能推荐 Emoji 和表情',
  },
  {
    key: 'spellCheck',
    icon: <FontSizeOutlined />,
    label: '拼写检查',
    description: '实时检查拼写错误并提供建议',
  },
  {
    key: 'voiceInput',
    icon: <MessageOutlined />,
    label: '语音输入',
    description: '支持语音转文字输入',
  },
]

interface KeyboardFeaturePanelProps {
  values?: Record<string, boolean>
  onChange?: (key: string, value: boolean) => void
}

export function KeyboardFeaturePanel({ values = {}, onChange }: KeyboardFeaturePanelProps) {
  return (
    <div>
      <Row gutter={[16, 16]}>
        {features.map((feature) => (
          <Col xs={24} sm={12} key={feature.key}>
            <Card
              size="small"
              className="feature-card"
              style={{
                borderRadius: 8,
                border: values[feature.key] ? '1px solid #1677ff' : '1px solid #f0f0f0',
              }}
            >
              <Space>
                <div style={{ fontSize: 20, color: '#1677ff' }}>
                  {feature.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Space>
                    <Text strong>{feature.label}</Text>
                    {feature.beta && <Tag color="purple">Beta</Tag>}
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {feature.description}
                    </Text>
                  </div>
                </div>
                <Switch
                  checked={values[feature.key]}
                  onChange={(checked) => onChange?.(feature.key, checked)}
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
