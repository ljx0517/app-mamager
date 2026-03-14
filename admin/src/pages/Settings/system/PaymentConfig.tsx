import { Card, Form, Input, Switch, Space, Divider, Alert, Button } from 'antd'
import { SaveOutlined, CreditCardOutlined } from '@ant-design/icons'

interface PaymentConfigValues {
  appleSharedSecret: string
  googleServiceAccount: string
  enableSandbox: boolean
}

interface PaymentConfigProps {
  initialValues?: PaymentConfigValues
  onSave: (values: PaymentConfigValues) => Promise<void>
}

export default function PaymentConfig({ initialValues, onSave }: PaymentConfigProps) {
  const [form] = Form.useForm()

  return (
    <Card title={<Space><CreditCardOutlined />支付配置</Space>} style={{ borderRadius: 12 }}>
      <Alert
        message="支付配置说明"
        description="配置应用内购买的验证密钥。生产环境请确保密钥安全。"
        type="info"
        showIcon
        className="mb-4"
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSave}
      >
        <Form.Item
          name="appleSharedSecret"
          label="Apple Shared Secret"
          extra="App Store Connect 中的 Shared Secret"
        >
          <Input.Password placeholder="请输入 Apple 密钥" />
        </Form.Item>

        <Form.Item
          name="googleServiceAccount"
          label="Google Service Account JSON"
          extra="Google Play 开发者账号的服务账户 JSON"
        >
          <Input.TextArea rows={4} placeholder='{"type": "service_account", ...}' />
        </Form.Item>

        <Form.Item
          name="enableSandbox"
          label="启用沙盒环境"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider />

        <Space>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
            保存配置
          </Button>
        </Space>
      </Form>
    </Card>
  )
}
