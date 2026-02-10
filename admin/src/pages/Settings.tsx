import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Divider,
  message,
  Row,
  Col,
  Space,
  Tabs,
  Alert,
  Empty,
} from 'antd'
import {
  SaveOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import { useAppStore } from '@/stores/appStore'

const { TextArea } = Input

// ===== 模拟 per-App 配置数据 =====

const mockConfigByApp: Record<string, Record<string, unknown>> = {
  app_001: {
    apiBaseUrl: 'https://api.aikeyboard.com',
    aiModelProvider: 'openai',
    aiModelName: 'gpt-4',
    aiMaxTokens: 1024,
    aiTemperature: 0.7,
    apiRateLimit: 100,
    trialDays: 7,
    freeQuotaDaily: 10,
    proQuotaDaily: 500,
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    emailNotification: true,
    slackWebhook: '',
    alertOnHighError: true,
    alertThreshold: 50,
    jwtSecret: '••••••••••••••••',
    jwtExpireDays: 30,
    enableRateLimit: true,
    maxRequestPerMinute: 60,
    enableIPWhitelist: false,
    ipWhitelist: '',
  },
  app_002: {
    apiBaseUrl: 'https://api.aitranslator.com',
    aiModelProvider: 'openai',
    aiModelName: 'gpt-4o',
    aiMaxTokens: 2048,
    aiTemperature: 0.3,
    apiRateLimit: 200,
    trialDays: 14,
    freeQuotaDaily: 20,
    proQuotaDaily: 1000,
    monthlyPrice: 7.99,
    yearlyPrice: 59.99,
    emailNotification: true,
    slackWebhook: '',
    alertOnHighError: false,
    alertThreshold: 100,
    jwtSecret: '••••••••••••••••',
    jwtExpireDays: 30,
    enableRateLimit: true,
    maxRequestPerMinute: 120,
    enableIPWhitelist: false,
    ipWhitelist: '',
  },
  app_003: {
    apiBaseUrl: 'https://api.aiwriter.com',
    aiModelProvider: 'anthropic',
    aiModelName: 'claude-3.5-sonnet',
    aiMaxTokens: 4096,
    aiTemperature: 0.8,
    apiRateLimit: 50,
    trialDays: 3,
    freeQuotaDaily: 5,
    proQuotaDaily: 200,
    monthlyPrice: 12.99,
    yearlyPrice: 99.99,
    emailNotification: false,
    slackWebhook: '',
    alertOnHighError: true,
    alertThreshold: 30,
    jwtSecret: '••••••••••••••••',
    jwtExpireDays: 15,
    enableRateLimit: true,
    maxRequestPerMinute: 30,
    enableIPWhitelist: false,
    ipWhitelist: '',
  },
}

export default function SettingsPage() {
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)

  const [apiForm] = Form.useForm()
  const [subscriptionForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const config = currentAppId ? mockConfigByApp[currentAppId] : undefined

  const handleSave = (formName: string) => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      message.success(`${currentApp?.name} - ${formName}已保存`)
    }, 600)
  }

  if (!currentApp || !config) {
    return (
      <div>
        <PageHeader title="应用设置" subtitle="请先选择一个应用" breadcrumbs={[{ title: '应用设置' }]} />
        <Card style={{ borderRadius: 12 }}><Empty description="请先选择一个应用" /></Card>
      </div>
    )
  }

  const tabItems = [
    {
      key: 'api',
      label: <Space><ApiOutlined />API 配置</Space>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Form form={apiForm} layout="vertical" initialValues={config} onFinish={() => handleSave('API 配置')}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="apiBaseUrl" label="API 基础地址" rules={[{ required: true }]}>
                  <Input placeholder="https://api.example.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="apiRateLimit" label="API 速率限制 (次/分)" rules={[{ required: true }]}>
                  <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Divider>AI 模型配置</Divider>
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item name="aiModelProvider" label="模型提供商" rules={[{ required: true }]}>
                  <Input placeholder="openai" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="aiModelName" label="模型名称" rules={[{ required: true }]}>
                  <Input placeholder="gpt-4" />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item name="aiMaxTokens" label="最大 Tokens">
                  <InputNumber min={64} max={8192} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item name="aiTemperature" label="Temperature">
                  <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存配置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'subscription',
      label: <Space><SettingOutlined />订阅配置</Space>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Form form={subscriptionForm} layout="vertical" initialValues={config} onFinish={() => handleSave('订阅配置')}>
            <Alert message={`修改 ${currentApp.name} 的订阅配置将影响所有新用户，现有订阅不受影响`} type="warning" showIcon className="mb-6" />
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item name="trialDays" label="免费试用天数"><InputNumber min={0} max={90} style={{ width: '100%' }} /></Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="freeQuotaDaily" label="免费版日配额"><InputNumber min={1} max={100} style={{ width: '100%' }} /></Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="proQuotaDaily" label="Pro 版日配额"><InputNumber min={1} max={10000} style={{ width: '100%' }} /></Form.Item>
              </Col>
            </Row>
            <Divider>定价设置</Divider>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="monthlyPrice" label="月度会员价格 (USD)">
                  <InputNumber min={0} step={0.01} precision={2} prefix="$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="yearlyPrice" label="年度会员价格 (USD)">
                  <InputNumber min={0} step={0.01} precision={2} prefix="$" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存配置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notification',
      label: <Space><BellOutlined />通知配置</Space>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Form form={notificationForm} layout="vertical" initialValues={config} onFinish={() => handleSave('通知配置')}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="emailNotification" label="邮件通知" valuePropName="checked"><Switch /></Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="alertOnHighError" label="高错误率告警" valuePropName="checked"><Switch /></Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="slackWebhook" label="Slack Webhook URL">
                  <Input placeholder="https://hooks.slack.com/services/..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="alertThreshold" label="告警阈值 (错误数/小时)">
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存配置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: <Space><SecurityScanOutlined />安全配置</Space>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Form form={securityForm} layout="vertical" initialValues={config} onFinish={() => handleSave('安全配置')}>
            <Alert message="安全配置修改后需要重启服务才能生效" type="info" showIcon className="mb-6" />
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="jwtSecret" label="JWT Secret"><Input.Password /></Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="jwtExpireDays" label="JWT 过期天数"><InputNumber min={1} max={365} style={{ width: '100%' }} /></Form.Item>
              </Col>
            </Row>
            <Divider>请求限制</Divider>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="enableRateLimit" label="启用速率限制" valuePropName="checked"><Switch /></Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="maxRequestPerMinute" label="最大请求数 (次/分)">
                  <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="enableIPWhitelist" label="启用 IP 白名单" valuePropName="checked"><Switch /></Form.Item>
              </Col>
              <Col xs={24} md={24}>
                <Form.Item name="ipWhitelist" label="IP 白名单 (每行一个)">
                  <TextArea rows={3} placeholder={"192.168.1.1\n10.0.0.0/24"} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存配置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="应用设置"
        subtitle={`${currentApp.icon} ${currentApp.name} 的配置管理`}
        breadcrumbs={[{ title: '应用设置' }]}
      />
      <Tabs items={tabItems} type="card" />
    </div>
  )
}
