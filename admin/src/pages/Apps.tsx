import { useState, useEffect } from 'react'
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
import { trpc } from '@/utils/trpc'
import { useSmartLoading } from '@/hooks/useLoading'
import { getRegisteredTemplates } from '@/config/appRegistry'

const { TextArea } = Input

// 后端App数据接口定义
interface BackendApp {
  id: string
  name: string
  slug?: string
  bundleId: string
  platform: 'ios' | 'android' | 'web'
  description?: string | null
  isActive: boolean
  apiKey: string
  apiSecret: string
  configTemplate?: string
  settings?: Record<string, any>
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * 将后端App数据转换为前端AppInfo格式
 * 注：前端需要但后端没有的字段使用默认值或转换逻辑
 */
function backendAppToFrontend(backendApp: BackendApp): AppInfo {
  // 将isActive转换为status
  const status = backendApp.isActive ? 'active' : 'inactive'

  // 获取slug：优先从API读取，否则从name生成
  const slug = backendApp.slug || backendApp.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')

  // 使用平台首字母作为图标，或从设置中读取
  const icon = getIconFromPlatform(backendApp.platform)

  // 获取配置模板（从顶层字段读取，兼容 settings 中的配置）
  const configTemplate = (backendApp as any).configTemplate || (backendApp as any).settings?.configTemplate

  return {
    id: backendApp.id,
    name: backendApp.name,
    slug,
    description: backendApp.description || '',
    icon,
    platform: backendApp.platform,
    bundleId: backendApp.bundleId,
    status,
    configTemplate,
    createdAt: typeof backendApp.createdAt === 'string'
      ? backendApp.createdAt
      : backendApp.createdAt.toISOString(),
    updatedAt: typeof backendApp.updatedAt === 'string'
      ? backendApp.updatedAt
      : backendApp.updatedAt.toISOString(),
  }
}

/**
 * 根据平台返回对应的emoji图标
 */
function getIconFromPlatform(platform: 'ios' | 'android' | 'web'): string {
  switch (platform) {
    case 'ios': return '📱'
    case 'android': return '🤖'
    case 'web': return '🌐'
    default: return '📦'
  }
}

/**
 * 将前端AppInfo转换为后端创建/更新所需的格式
 */
function frontendAppToBackendCreate(appInfo: Partial<AppInfo>) {
  return {
    name: appInfo.name || '',
    bundleId: appInfo.bundleId || '',
    platform: (appInfo.platform as 'ios' | 'android' | 'web') || 'ios',
    description: appInfo.description,
    configTemplate: appInfo.configTemplate,
    // 创建时由后端自动生成apiKey/apiSecret
  }
}

function frontendAppToBackendUpdate(appInfo: Partial<AppInfo>) {
  const updateData: any = {}

  if (appInfo.name !== undefined) updateData.name = appInfo.name
  if (appInfo.description !== undefined) updateData.description = appInfo.description
  if (appInfo.status !== undefined) updateData.isActive = appInfo.status === 'active'

  return updateData
}

export default function AppsPage() {
  const { apps, setApps, addApp, updateApp, removeApp, setCurrentApp } = useAppStore()
  const [editingApp, setEditingApp] = useState<AppInfo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { token } = theme.useToken()

  // tRPC 查询和变更
  const appsQuery = trpc.app.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })
  const createAppMutation = trpc.app.create.useMutation()
  const updateAppMutation = trpc.app.update.useMutation()
  const deleteAppMutation = trpc.app.delete.useMutation()

  // 组合加载状态
  const overallLoading = useSmartLoading({
    queries: [appsQuery],
    mutations: [createAppMutation, updateAppMutation, deleteAppMutation],
    manualStates: [loading],
  })

  // 当API数据加载完成时，更新store
  useEffect(() => {
    if (appsQuery.data) {
      // 将后端App数据转换为前端AppInfo格式
      const convertedApps = appsQuery.data.map(backendAppToFrontend)
      setApps(convertedApps)
    }
  }, [appsQuery.data, setApps])

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
    deleteAppMutation.mutate({ id }, {
      onSuccess: (data) => {
        message.success(data.message || '应用已删除')
        appsQuery.refetch() // 刷新列表
      },
      onError: (error) => {
        message.error(error.message || '删除应用失败')
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 将前端平台枚举转换为后端平台枚举
      const platform = values.platform === 'cross_platform' ? 'ios' : values.platform

      if (editingApp) {
        // 更新现有应用
        const updateData: any = {
          id: editingApp.id,
          name: values.name,
          slug: values.slug,
          description: values.description,
          isActive: values.status === 'active',
        }

        // 添加配置模板（如果选择了模板）
        if (values.configTemplate) {
          updateData.configTemplate = values.configTemplate
        }

        updateAppMutation.mutate(updateData, {
          onSuccess: async (data) => {
            message.success(data.message || '应用已更新')
            await appsQuery.refetch() // 等待刷新完成
            setModalOpen(false)
          },
          onError: (error) => {
            message.error(error.message || '更新应用失败')
          },
        })
      } else {
        // 创建新应用
        const createData: any = {
          name: values.name,
          slug: values.slug,
          bundleId: values.bundleId || `${values.slug}.app`,
          platform,
          description: values.description,
          icon: values.icon || '📱', // 默认图标
        }

        // 添加配置模板（如果选择了模板）
        if (values.configTemplate) {
          createData.configTemplate = values.configTemplate
        }

        createAppMutation.mutate(createData, {
          onSuccess: async (data) => {
            message.success(data.message || '应用已创建')
            await appsQuery.refetch() // 等待刷新完成
            setModalOpen(false)
          },
          onError: (error) => {
            message.error(error.message || '创建应用失败')
          },
        })
      }
    } catch {
      // 表单校验失败
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    appsQuery.refetch().then(() => {
      setLoading(false)
      message.success('数据已刷新')
    }).catch((error) => {
      setLoading(false)
      console.error('刷新数据失败:', error)
    })
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
      title: '配置模板',
      dataIndex: 'configTemplate',
      key: 'configTemplate',
      width: 120,
      render: (configTemplate?: string) => {
        if (!configTemplate) {
          return <span style={{ color: token.colorTextQuaternary }}>-</span>
        }
        const template = getRegisteredTemplates().find(t => t.id === configTemplate)
        return template ? (
          <Tag color="blue">{template.icon} {template.displayName}</Tag>
        ) : (
          <Tag>{configTemplate}</Tag>
        )
      },
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
          loading={overallLoading}
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
        confirmLoading={createAppMutation.isPending || updateAppMutation.isPending}
        okButtonProps={{
          disabled: createAppMutation.isPending || updateAppMutation.isPending,
        }}
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

          <Form.Item
            name="configTemplate"
            label="配置模板"
            tooltip="选择该应用使用的设置界面模板，多个应用可以使用同一模板"
          >
            <Select
              placeholder="选择配置模板（可选）"
              allowClear
              options={[
                ...getRegisteredTemplates().map((t) => ({
                  label: `${t.icon} ${t.displayName}`,
                  value: t.id,
                })),
                {
                  label: '无模板',
                  value: '',
                  disabled: false,
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
