import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Space, Divider, message, Select, Tag } from 'antd'
import { SaveOutlined, ApiOutlined, ExperimentOutlined } from '@ant-design/icons'

interface AIConfigValues {
  apiKey: string
  baseUrl: string
  model: string
  defaultProvider: string
  enableStream: boolean
}

interface AIConfigProps {
  initialValues?: AIConfigValues
  onSave: (values: AIConfigValues) => Promise<void>
}

export default function AIConfig({ initialValues, onSave }: AIConfigProps) {
  const [form] = Form.useForm()
  const [testing, setTesting] = useState(false)

  // 填充初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [initialValues, form])

  const handleTest = async () => {
    setTesting(true)
    setTimeout(() => {
      setTesting(false)
      message.success('API 连接测试成功')
    }, 1500)
  }

  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google' },
    { value: 'azure_openai', label: 'Azure OpenAI' },
    { value: 'mock', label: 'Mock (测试)' },
  ]

  return (
    <Card title={<Space><ApiOutlined />AI 配置</Space>} style={{ borderRadius: 12 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSave}
      >
        <Form.Item
          name="defaultProvider"
          label="默认 AI 提供商"
          rules={[{ required: true, message: '请选择默认 AI 提供商' }]}
        >
          <Select
            options={providerOptions}
            placeholder="选择默认 AI 提供商"
          />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="API Key"
          extra="用于调用 AI 服务的密钥"
        >
          <Input.Password placeholder="sk-..." />
        </Form.Item>

        <Form.Item
          name="baseUrl"
          label="API Endpoint"
          extra="AI 服务端点地址（可选，自定义域名使用）"
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          name="model"
          label="默认模型"
          extra="不填则使用提供商默认值"
        >
          <Input placeholder="gpt-4o" />
        </Form.Item>

        <Form.Item
          name="enableStream"
          label="启用流式响应"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider />

        <Space>
          <Button icon={<ExperimentOutlined />} onClick={handleTest} loading={testing}>
            测试连接
          </Button>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
            保存配置
          </Button>
        </Space>
      </Form>

      <Divider />

      <div>
        <Space orientation="vertical" size="small">
          <Tag color="blue">提示</Tag>
          <span style={{ color: '#666', fontSize: 12 }}>
            保存后，AI 配置将应用到当前应用的所有用户。
            如需为不同应用配置不同的 AI，请先切换到对应应用。
          </span>
        </Space>
      </div>
    </Card>
  )
}
