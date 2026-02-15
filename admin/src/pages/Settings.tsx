/**
 * 设置页面入口
 * 支持通过 configTemplate 动态加载各 App 的配置模板
 */
import { useEffect, useState, Suspense } from 'react'
import { Card, Empty, Spin, Tabs, Row, Col, Form, Input, InputNumber, Switch, Button, Space, Alert, message } from 'antd'
import {
  ApiOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { useAppStore } from '@/stores/appStore'
import { trpc } from '@/utils/trpc'
import { hasConfigTemplate, getConfigTemplate, getRegisteredTemplates } from '@/config/appRegistry'

// 懒加载各配置模板的设置页面
const templateSettingsImports: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'ai-keyboard': () => import('@/pages/Settings/configs/ai-keyboard').then(module => ({ default: module.default })),
}

export default function SettingsPage() {
  const { templateId } = useParams<{ templateId?: string }>()
  const { currentApp } = useAppStore()

  // 获取当前 App 绑定的配置模板
  const configTemplate = currentApp?.configTemplate || templateId

  // 检测是否有专属配置
  const hasCustom = configTemplate ? hasConfigTemplate(configTemplate) : false

  // 如果 URL 中指定了 templateId 且有专属配置，渲染专属页面
  if (templateId && hasCustom) {
    return (
      <Suspense
        fallback={
          <div>
            <PageHeader
              title="应用设置"
              breadcrumbs={[{ title: '设置' }]}
            />
            <Card style={{ borderRadius: 12 }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            </Card>
          </div>
        }
      >
        <TemplateSettingsLoader templateId={templateId} />
      </Suspense>
    )
  }

  // 如果有专属配置但 URL 没有指定，引导用户选择
  if (hasCustom && !templateId) {
    return <TemplateSettingsSelector />
  }

  // 否则渲染默认设置页面
  return <DefaultSettingsPage />
}

/**
 * 动态加载配置模板页面
 */
function TemplateSettingsLoader({ templateId }: { templateId: string }) {
  const SettingsComponent = templateSettingsImports[templateId]

  if (!SettingsComponent) {
    return (
      <div>
        <PageHeader
          title="应用设置"
          breadcrumbs={[{ title: '设置' }]}
        />
        <Alert
          message="配置模板不存在"
          description={`模板 ${templateId} 未找到`}
          type="error"
          showIcon
        />
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = SettingsComponent as any
  return <Component />
}

/**
 * 配置模板选择器
 * 当有多个配置模板可用时，让用户选择
 */
function TemplateSettingsSelector() {
  const { currentApp } = useAppStore()
  const navigate = useNavigate()

  // 获取当前 App 的配置模板
  const configTemplate = currentApp?.configTemplate

  // 如果当前 App 已有配置模板，直接跳转
  if (configTemplate && hasConfigTemplate(configTemplate)) {
    navigate(`/settings/${configTemplate}`)
    return null
  }

  // 获取所有可用的配置模板
  const availableTemplates = getRegisteredTemplates()

  // 如果只有一个，直接跳转
  useEffect(() => {
    if (availableTemplates.length === 1) {
      navigate(`/settings/${availableTemplates[0].id}`)
    }
  }, [availableTemplates, navigate])

  if (availableTemplates.length === 0) {
    return <DefaultSettingsPage />
  }

  if (!currentApp) {
    return (
      <div>
        <PageHeader title="应用设置" subtitle="请先选择一个应用" breadcrumbs={[{ title: '应用设置' }]} />
        <Card style={{ borderRadius: 12 }}><Empty description="请先选择一个应用" /></Card>
      </div>
    )
  }

  // 跳转到当前应用的配置模板页
  if (configTemplate && hasConfigTemplate(configTemplate)) {
    navigate(`/settings/${configTemplate}`)
    return null
  }

  return (
    <div>
      <PageHeader
        title="应用设置"
        subtitle="选择要使用的配置模板"
        breadcrumbs={[{ title: '应用设置' }]}
      />
      <Alert
        message="配置模板未绑定"
        description={`当前应用 "${currentApp.name}" 未绑定配置模板，请在应用管理中设置`}
        type="warning"
        showIcon
        className="mb-4"
      />
      <Row gutter={[16, 16]}>
        {availableTemplates.map(template => (
          <Col xs={24} sm={12} md={8} key={template.id}>
            <Card
              hoverable
              style={{ borderRadius: 12 }}
              onClick={() => navigate(`/settings/${template.id}`)}
            >
              <Space>
                <span style={{ fontSize: 24 }}>{template.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{template.displayName}</div>
                  {template.description && (
                    <div style={{ fontSize: 12, color: '#999' }}>{template.description}</div>
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

/**
 * 默认设置页面
 * 通用的应用配置表单
 */
function DefaultSettingsPage() {
  const { currentApp } = useAppStore()
  const currentAppId = currentApp?.id

  const [apiForm] = Form.useForm()
  const [subscriptionForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // tRPC 查询 - 获取应用配置
  const settingsQuery = trpc.settings.app.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId }
  )

  // tRPC mutation - 更新应用配置
  const updateSettingsMutation = trpc.settings.updateApp.useMutation({
    onSuccess: () => {
      message.success('配置已保存')
      settingsQuery.refetch()
    },
    onError: (error) => {
      message.error(error.message || '保存失败')
    },
  })

  // 加载配置数据到表单
  const settings = settingsQuery.data?.settings

  const handleSave = () => {
    setSaving(true)

    const formValues = {
      ...apiForm.getFieldsValue(),
      ...subscriptionForm.getFieldsValue(),
      ...notificationForm.getFieldsValue(),
      ...securityForm.getFieldsValue(),
    }

    updateSettingsMutation.mutate({
      appId: currentAppId!,
      ...formValues,
    })

    setTimeout(() => setSaving(false), 500)
  }

  if (!currentAppId) {
    return (
      <div>
        <PageHeader title="应用设置" subtitle="请先选择一个应用" breadcrumbs={[{ title: '应用设置' }]} />
        <Card style={{ borderRadius: 12 }}><Empty description="请先选择一个应用" /></Card>
      </div>
    )
  }

  // 等待加载
  if (settingsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="应用设置" breadcrumbs={[{ title: '应用设置' }]} />
        <Card style={{ borderRadius: 12 }}>加载中...</Card>
      </div>
    )
  }

  const tabItems = [
    {
      key: 'api',
      label: <Space><ApiOutlined />API 配置</Space>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Form
            form={apiForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSave}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="freeReplyLimitPerDay" label="免费版日配额" rules={[{ required: true }]}>
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="freeCandidateCount" label="免费版候选数" rules={[{ required: true }]}>
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="proCandidateCount" label="Pro 版候选数" rules={[{ required: true }]}>
                  <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="defaultAIProvider" label="默认 AI 提供商">
                  <Input placeholder="openai" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置
              </Button>
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
          <Alert message={`修改 ${currentApp?.name} 的订阅配置将影响所有新用户，现有订阅不受影响`} type="warning" showIcon className="mb-6" />
          <Form
            form={subscriptionForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSave}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="enableSubscription" label="启用订阅功能" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="enableAI" label="启用 AI 功能" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置
              </Button>
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
          <Form
            form={notificationForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSave}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="emailNotification" label="邮件通知" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="alertOnHighError" label="高错误率告警" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置
              </Button>
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
          <Alert message="安全配置修改后需要重启服务才能生效" type="info" showIcon className="mb-6" />
          <Form
            form={securityForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSave}
          >
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置
              </Button>
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
        subtitle={`${currentApp?.icon} ${currentApp?.name} 的配置管理`}
        breadcrumbs={[{ title: '应用设置' }]}
      />
      <Tabs items={tabItems} type="card" />
    </div>
  )
}
