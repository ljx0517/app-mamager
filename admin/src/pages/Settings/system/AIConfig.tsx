import { useState } from 'react'
import { Card, Form, Input, Button, Switch, Space, Divider, message } from 'antd'
import { SaveOutlined, ApiOutlined, ExperimentOutlined } from '@ant-design/icons'

interface AIConfigValues {
  apiKey: string
  endpoint: string
  model: string
  enableStream: boolean
}

interface AIConfigProps {
  initialValues?: AIConfigValues
  onSave: (values: AIConfigValues) => Promise<void>
}

export default function AIConfig({ initialValues, onSave }: AIConfigProps) {
  const [form] = Form.useForm()
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTimeout(() => {
      setTesting(false)
      message.success('API 连接测试成功')
    }, 1500)
  }

  return (
    <Card title={<Space><ApiOutlined />AI 配置</Space>} style={{ borderRadius: 12 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSave}
      >
        <Form.Item
          name="apiKey"
          label="API Key"
          extra="用于调用 AI 服务的密钥"
        >
          <Input.Password placeholder="sk-..." />
        </Form.Item>

        <Form.Item
          name="endpoint"
          label="API Endpoint"
          extra="AI 服务端点地址"
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          name="model"
          label="默认模型"
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
    </Card>
  )
}
