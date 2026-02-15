/**
 * 订阅计划面板 - AI Keyboard 专属组件
 * 用于配置订阅计划和权益
 */
import { Card, Row, Col, Switch, InputNumber, Typography, Space, Divider, Alert } from 'antd'
import {
  CrownOutlined,
  RocketOutlined,
  StarOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface PlanItem {
  key: string
  icon: React.ReactNode
  label: string
  color: string
}

const plans: PlanItem[] = [
  { key: 'free', icon: <StarOutlined />, label: '免费版', color: '#999' },
  { key: 'pro_monthly', icon: <RocketOutlined />, label: 'Pro 月付', color: '#1677ff' },
  { key: 'pro_yearly', icon: <CrownOutlined />, label: 'Pro 年付', color: '#faad14' },
]

interface SubscriptionPlansPanelProps {
  values?: Record<string, any>
  onChange?: (key: string, value: any) => void
}

export function SubscriptionPlansPanel({ values = {}, onChange }: SubscriptionPlansPanelProps) {
  const subscriptionConfig = values.subscriptionConfig || {}

  const handlePlanChange = (planKey: string, field: string, value: any) => {
    const newConfig = {
      ...subscriptionConfig,
      [planKey]: {
        ...subscriptionConfig[planKey],
        [field]: value,
      },
    }
    onChange?.('subscriptionConfig', newConfig)
  }

  return (
    <div>
      <Alert
        message="订阅配置说明"
        description="修改订阅配置将影响所有新用户，现有订阅不受影响。价格单位为美元。"
        type="info"
        showIcon
        className="mb-4"
      />

      <Row gutter={[16, 16]}>
        {plans.map((plan) => (
          <Col xs={24} md={8} key={plan.key}>
            <Card
              size="small"
              title={
                <Space>
                  <span style={{ color: plan.color }}>{plan.icon}</span>
                  <span>{plan.label}</span>
                </Space>
              }
              style={{ borderRadius: 8 }}
            >
              {plan.key === 'free' ? (
                <div>
                  <Text type="secondary">免费用户提供基础功能</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>启用订阅</Text>
                      <Switch
                        size="small"
                        checked={subscriptionConfig[plan.key]?.enabled ?? true}
                        onChange={(checked) => handlePlanChange(plan.key, 'enabled', checked)}
                      />
                    </Space>
                  </Space>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text type="secondary">价格 (美元)</Text>
                    <InputNumber
                      prefix="$"
                      min={0}
                      precision={2}
                      style={{ width: '100%', marginTop: 4 }}
                      value={subscriptionConfig[plan.key]?.price || 0}
                      onChange={(value) => handlePlanChange(plan.key, 'price', value)}
                    />
                  </div>

                  <div>
                    <Text type="secondary">免费试用天数</Text>
                    <InputNumber
                      min={0}
                      max={30}
                      style={{ width: '100%', marginTop: 4 }}
                      value={subscriptionConfig[plan.key]?.trialDays || 0}
                      onChange={(value) => handlePlanChange(plan.key, 'trialDays', value)}
                    />
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <Text strong>权益配置</Text>

                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary">AI 回复</Text>
                      <Switch
                        size="small"
                        checked={subscriptionConfig[plan.key]?.aiReply ?? true}
                        onChange={(checked) => handlePlanChange(plan.key, 'aiReply', checked)}
                      />
                    </Space>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary">自定义主题</Text>
                      <Switch
                        size="small"
                        checked={subscriptionConfig[plan.key]?.customTheme ?? true}
                        onChange={(checked) => handlePlanChange(plan.key, 'customTheme', checked)}
                      />
                    </Space>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary">云同步</Text>
                      <Switch
                        size="small"
                        checked={subscriptionConfig[plan.key]?.cloudSync ?? true}
                        onChange={(checked) => handlePlanChange(plan.key, 'cloudSync', checked)}
                      />
                    </Space>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text type="secondary">无广告</Text>
                      <Switch
                        size="small"
                        checked={subscriptionConfig[plan.key]?.noAds ?? true}
                        onChange={(checked) => handlePlanChange(plan.key, 'noAds', checked)}
                      />
                    </Space>
                  </Space>
                </Space>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
