import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  theme,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '@/components/PageHeader'
import StatsCard from '@/components/StatsCard'
import { useAppStore } from '@/stores/appStore'
import type { AppInfo } from '@/types'
import {
  APP_STATUS_LABELS,
  APP_STATUS_COLORS,
  APP_PLATFORM_LABELS,
  APP_PLATFORM_COLORS,
} from '@/utils/constants'

const { TextArea } = Input

export default function AppsPage() {
  const { apps, addApp, updateApp, removeApp, setCurrentApp } = useAppStore()
  const [editingApp, setEditingApp] = useState<AppInfo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { token } = theme.useToken()

  // 统计
  const stats = {
    total: apps.length,
    active: apps.filter((a) => a.status === 'active').length,
    maintenance: apps.filter((a) => a.status === 'maintenance').length,
    ios: apps.filter((a) => a.platform === 'ios').length,
  }

  const handleAdd = () => {
    setEditingApp(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'active',
      platform: 'ios',
    })
    setModalOpen(true)
  }

  const handleEdit = (app: AppInfo) => {
    setEditingApp(app)
    form.setFieldsValue(app)
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    removeApp(id)
    message.success('应用已删除')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const now = new Date().toISOString()

      if (editingApp) {
        updateApp(editingApp.id, values)
        message.success('应用已更新')
      } else {
        const newApp: AppInfo = {
          id: `app_${Date.now()}`,
          ...values,
          createdAt: now,
          updatedAt: now,
        }
        addApp(newApp)
        message.success('应用已创建')
      }
      setModalOpen(false)
    } catch {
      // 表单校验失败
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 500)
  }

  const handleSwitchTo = (appId: string) => {
    setCurrentApp(appId)
    message.success('已切换到该应用')
  }

  const columns: ColumnsType<AppInfo> = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      render: (icon: string) => <span className="text-2xl">{icon}</span>,
    },
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (name: string, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div
            className="text-xs mt-0.5"
            style={{ color: token.colorTextDescription }}
          >
            {record.slug}
          </div>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => (
        <Tag color={APP_PLATFORM_COLORS[platform]}>
          {APP_PLATFORM_LABELS[platform]}
        </Tag>
      ),
    },
    {
      title: 'Bundle ID',
      dataIndex: 'bundleId',
      key: 'bundleId',
      ellipsis: true,
      width: 200,
      render: (bundleId?: string) => (
        <span
          className="text-xs font-mono"
          style={{ color: token.colorTextSecondary }}
        >
          {bundleId ?? '-'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={APP_STATUS_COLORS[status]}>
          {APP_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleSwitchTo(record.id)}
          >
            进入
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此应用？"
            description="删除后该应用的所有管理数据将无法访问"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="应用管理"
        subtitle="管理平台中所有接入的应用"
        breadcrumbs={[{ title: '应用管理' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增应用
            </Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="应用总数"
            value={stats.total}
            icon={<AppstoreOutlined />}
            color="#1677ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="运行中"
            value={stats.active}
            icon={<AppstoreOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="维护中"
            value={stats.maintenance}
            icon={<AppstoreOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="iOS 应用"
            value={stats.ios}
            icon={<AppstoreOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* 应用列表 */}
      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={apps}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            showTotal: (total) => `共 ${total} 个应用`,
          }}
          size="middle"
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingApp ? '编辑应用' : '新增应用'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingApp ? '保存' : '创建'}
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="应用名称"
                rules={[{ required: true, message: '请输入应用名称' }]}
              >
                <Input placeholder="例如：AI Keyboard" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="icon"
                label="图标 (Emoji)"
                rules={[{ required: true, message: '请输入图标' }]}
              >
                <Input placeholder="⌨️" maxLength={4} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="slug"
            label="应用标识 (slug)"
            rules={[
              { required: true, message: '请输入应用标识' },
              { pattern: /^[a-z0-9-]+$/, message: '只允许小写字母、数字和连字符' },
            ]}
          >
            <Input placeholder="ai-keyboard" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入应用描述' }]}
          >
            <TextArea rows={2} placeholder="简要描述该应用..." maxLength={200} showCount />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="platform"
                label="平台"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'iOS', value: 'ios' },
                    { label: 'Android', value: 'android' },
                    { label: 'Web', value: 'web' },
                    { label: '跨平台', value: 'cross_platform' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: '运行中', value: 'active' },
                    { label: '未激活', value: 'inactive' },
                    { label: '维护中', value: 'maintenance' },
                    { label: '已归档', value: 'archived' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="bundleId" label="Bundle ID / Package Name">
            <Input placeholder="com.example.myapp" maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
