import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message, theme } from 'antd'
import { UserOutlined, LockOutlined, CloudServerOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { trpc } from '@/utils/trpc'
import { PLATFORM_NAME } from '@/utils/constants'

interface LoginFormValues {
  username: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { token } = theme.useToken()

  // tRPC 登录 mutation
  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      const { token, admin } = data
      login(
        {
          id: admin.id,
          username: admin.username,
          role: admin.role as 'admin' | 'super_admin',
        },
        token,
      )
      message.success('登录成功，欢迎回来！')
      navigate('/')
    },
    onError: (error) => {
      // 错误已由全局错误处理中间件显示，这里可以处理特殊逻辑
      // 例如：认证失败时清空本地存储
      if (error.data?.code === 'UNAUTHORIZED') {
        localStorage.removeItem('admin_token')
      }
    },
  })

  const handleLogin = async (values: LoginFormValues) => {
    console.log('🔍 handleLogin called with values:', values)
    console.log('🔍 loginMutation:', loginMutation)
    console.log('🔍 trpc.admin.login:', trpc.admin.login)
    console.log('🔍 trpc object:', trpc)
    loginMutation.mutate(values)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgLayout} 50%, ${token.colorPrimaryBgHover} 100%)`,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        {/* Logo & 标题 */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-2xl mb-4"
            style={{
              width: 64,
              height: 64,
              backgroundColor: `${token.colorPrimary}15`,
            }}
          >
            <CloudServerOutlined
              style={{ fontSize: 32, color: token.colorPrimary }}
            />
          </div>
          <h1
            className="text-xl font-semibold m-0"
            style={{ color: token.colorText }}
          >
            {PLATFORM_NAME}
          </h1>
          <p
            className="mt-2 mb-0 text-sm"
            style={{ color: token.colorTextSecondary }}
          >
            多应用统一管理后台
          </p>
        </div>

        {/* 登录表单 */}
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loginMutation.isPending}
              block
              style={{ height: 44, borderRadius: 8 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 开发提示 */}
        <div
          className="mt-6 text-center text-xs"
          style={{ color: token.colorTextQuaternary }}
        >
          开发环境：admin / admin123
        </div>
      </Card>
    </div>
  )
}
