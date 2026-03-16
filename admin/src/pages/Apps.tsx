import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Table,
  Drawer,
  Row,
  Col,
  theme,
  Typography,
  Popconfirm,
  Descriptions,
  Divider,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  ApiOutlined,
  EnterOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
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

const { TextArea } = Input
const { Text } = Typography

// 后端App数据接口定义
interface BackendApp {
  id: string
  name: string
  slug?: string | null
  bundleId: string
  platform: 'ios' | 'android' | 'web'
  description?: string | null
  isActive: boolean
  apiKey: string
  apiSecret: string
  configTemplate?: string | null
  settings?: Record<string, any> | null
  createdAt: Date | string
  updatedAt: Date | string
}

// 模板数据类型定义
interface TemplateData {
  id: string
  templateId: string
  displayName: string
  icon: string
  description?: string
  componentPath: string
  defaultConfig?: Record<string, unknown>
  isBuiltin: boolean
  sortOrder: number
}

/**
 * 将后端App数据转换为前端AppInfo格式
 */
function backendAppToFrontend(backendApp: BackendApp): AppInfo {
  const status = backendApp.isActive ? 'active' : 'inactive'
  const slug = backendApp.slug || backendApp.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
  const icon = getIconFromPlatform(backendApp.platform)
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

function getIconFromPlatform(platform: 'ios' | 'android' | 'web'): string {
  switch (platform) {
    case 'ios': return '📱'
    case 'android': return '🤖'
    case 'web': return '🌐'
    default: return '📦'
  }
}

export default function AppsPage() {
  const { apps, setApps, setCurrentApp } = useAppStore()
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [editingApp, setEditingApp] = useState<AppInfo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [form] = Form.useForm()
  const { token } = theme.useToken()
  const navigate = useNavigate()

  // tRPC
  const appsQuery = trpc.app.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })
  const templatesQuery = trpc.template.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })
  const createAppMutation = trpc.app.create.useMutation()
  const updateAppMutation = trpc.app.update.useMutation()
  const deleteAppMutation = trpc.app.delete.useMutation()

  const overallLoading = useSmartLoading({
    queries: [appsQuery],
    mutations: [createAppMutation, updateAppMutation, deleteAppMutation],
    manualStates: [loading],
  })

  useEffect(() => {
    if (appsQuery.data) {
      const convertedApps = appsQuery.data.map(backendAppToFrontend)
      setApps(convertedApps)
    }
  }, [appsQuery.data, setApps])

  // 过滤应用列表
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchSearch = !searchText ||
        app.name.toLowerCase().includes(searchText.toLowerCase()) ||
        app.bundleId?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.slug?.toLowerCase().includes(searchText.toLowerCase())
      const matchStatus = statusFilter === 'all' || app.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [apps, searchText, statusFilter])

  // 选中应用详情
  const selectedApp = useMemo(() => {
    return apps.find(a => a.id === selectedAppId)
  }, [apps, selectedAppId])

  // 统计
  const stats = useMemo(() => ({
    total: apps.length,
    active: apps.filter(a => a.status === 'active').length,
    inactive: apps.filter(a => a.status === 'inactive').length,
    ios: apps.filter(a => a.platform === 'ios').length,
  }), [apps])

  const handleAdd = () => {
    setEditingApp(null)
    form.resetFields()
    form.setFieldsValue({ status: 'active', platform: 'ios' })
    setModalOpen(true)
  }

  const handleEdit = () => {
    if (selectedApp) {
      setEditingApp(selectedApp)
      form.setFieldsValue(selectedApp)
      setModalOpen(true)
      setDrawerOpen(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteAppMutation.mutate({ id }, {
      onSuccess: (data) => {
        message.success(data.message || '应用已删除')
        appsQuery.refetch()
        if (selectedAppId === id) {
          setSelectedAppId(null)
        }
      },
      onError: (error) => {
        message.error(error.message || '删除应用失败')
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const platform = values.platform === 'cross_platform' ? 'ios' : values.platform

      if (editingApp) {
        const updateData: any = {
          id: editingApp.id,
          name: values.name,
          slug: values.slug,
          description: values.description,
          isActive: values.status === 'active',
          bundleId: values.bundleId,
        }
        if (values.configTemplate) updateData.configTemplate = values.configTemplate

        updateAppMutation.mutate(updateData, {
          onSuccess: async (data) => {
            message.success(data.message || '应用已更新')
            await appsQuery.refetch()
            setModalOpen(false)
          },
          onError: (error) => message.error(error.message || '更新应用失败'),
        })
      } else {
        const createData: any = {
          name: values.name,
          slug: values.slug,
          bundleId: values.bundleId || `${values.slug}.app`,
          platform,
          description: values.description,
          icon: values.icon || '📱',
        }
        if (values.configTemplate) createData.configTemplate = values.configTemplate

        createAppMutation.mutate(createData, {
          onSuccess: async (data) => {
            message.success(data.message || '应用已创建')
            await appsQuery.refetch()
            setModalOpen(false)
          },
          onError: (error) => message.error(error.message || '创建应用失败'),
        })
      }
    } catch { /* 表单校验失败 */ }
  }

  const handleRefresh = () => {
    setLoading(true)
    appsQuery.refetch().then(() => {
      setLoading(false)
      message.success('数据已刷新')
    }).catch(() => setLoading(false))
  }

  const handleViewDetail = (app: AppInfo) => {
    setSelectedAppId(app.id)
    setDrawerOpen(true)
  }

  const handleEnterApp = (appId: string) => {
    setCurrentApp(appId)
    navigate(`/${appId}/dashboard`)
  }

  const handleGoToSettings = (app: AppInfo) => {
    const targetPath = app.configTemplate ? `/${app.id}/settings/${app.configTemplate}` : `/${app.id}/settings`
    setCurrentApp(app.id)
    navigate(targetPath)
  }

  // 表格列定义
  const columns = [
    {
      title: '应用',
      key: 'app',
      fixed: 'left' as const,
      width: 280,
      render: (_: any, record: AppInfo) => (
        <Space>
          <span style={{ fontSize: 24 }}>{record.icon}</span>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.slug}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={APP_STATUS_COLORS[status as keyof typeof APP_STATUS_COLORS]}>
          {APP_STATUS_LABELS[status as keyof typeof APP_STATUS_LABELS]}
        </Tag>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => (
        <Tag color={APP_PLATFORM_COLORS[platform as keyof typeof APP_PLATFORM_COLORS]}>
          {APP_PLATFORM_LABELS[platform as keyof typeof APP_PLATFORM_LABELS]}
        </Tag>
      ),
    },
    {
      title: 'Bundle ID',
      dataIndex: 'bundleId',
      key: 'bundleId',
      width: 200,
      render: (bundleId: string) => bundleId ? <Text code style={{ fontSize: 12 }}>{bundleId}</Text> : '-',
    },
    {
      title: '配置模板',
      dataIndex: 'configTemplate',
      key: 'configTemplate',
      width: 140,
      render: (template: string) => template ? (
        <Tag color="blue">
          {(templatesQuery.data as TemplateData[] | undefined)?.find(t => t.templateId === template)?.displayName || template}
        </Tag>
      ) : <Text type="secondary">未绑定</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 220,
      render: (_: any, record: AppInfo) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleGoToSettings(record)}
          >
            设置
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EnterOutlined />}
            onClick={() => handleEnterApp(record.id)}
          >
            进入
          </Button>
          <Popconfirm
            title="确定删除此应用？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
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
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建应用</Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={6}>
          <StatsCard title="应用总数" value={stats.total} icon={<AppstoreOutlined />} color="#1677ff" />
        </Col>
        <Col xs={12} sm={6}>
          <StatsCard title="运行中" value={stats.active} icon={<Badge status="success" />} color="#52c41a" />
        </Col>
        <Col xs={12} sm={6}>
          <StatsCard title="已停用" value={stats.inactive} icon={<Badge status="error" />} color="#ff4d4f" />
        </Col>
        <Col xs={12} sm={6}>
          <StatsCard title="iOS 应用" value={stats.ios} icon={<AppstoreOutlined />} color="#722ed1" />
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 12 }}
      >
        {/* 搜索筛选栏 */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${token.colorBorder}`,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Input
            placeholder="搜索应用名称、Bundle ID、Slug..."
            prefix={<AppstoreOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '运行中', value: 'active' },
              { label: '已停用', value: 'inactive' },
            ]}
          />
          <Text type="secondary">
            共 {filteredApps.length} 个应用
          </Text>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={filteredApps}
          loading={overallLoading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedAppId ? [selectedAppId] : [],
            onChange: (keys) => {
              if (keys.length > 0) {
                setSelectedAppId(keys[0] as string)
              }
            }
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            defaultPageSize: 10,
          }}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => handleViewDetail(record),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={
          selectedApp ? (
            <Space>
              <span style={{ fontSize: 20 }}>{selectedApp.icon}</span>
              <span>{selectedApp.name}</span>
              <Tag color={APP_STATUS_COLORS[selectedApp.status]}>
                {APP_STATUS_LABELS[selectedApp.status]}
              </Tag>
            </Space>
          ) : '应用详情'
        }
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => selectedApp && handleGoToSettings(selectedApp)}
            >
              设置
            </Button>
            <Button
              type="primary"
              icon={<EnterOutlined />}
              onClick={() => selectedApp && handleEnterApp(selectedApp.id)}
            >
              进入
            </Button>
          </Space>
        }
      >
        {selectedApp && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="应用名称">{selectedApp.name}</Descriptions.Item>
              <Descriptions.Item label="应用标识">{selectedApp.slug}</Descriptions.Item>
              <Descriptions.Item label="Bundle ID">
                {selectedApp.bundleId ? <Text code>{selectedApp.bundleId}</Text> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="平台">
                <Tag color={APP_PLATFORM_COLORS[selectedApp.platform]}>
                  {APP_PLATFORM_LABELS[selectedApp.platform]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={APP_STATUS_COLORS[selectedApp.status]}>
                  {APP_STATUS_LABELS[selectedApp.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="配置模板">
                {selectedApp.configTemplate ? (
                  <Tag color="blue">
                    {(templatesQuery.data as TemplateData[] | undefined)?.find(t => t.templateId === selectedApp.configTemplate)?.displayName || selectedApp.configTemplate}
                  </Tag>
                ) : <Text type="secondary">未绑定</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="描述">{selectedApp.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedApp.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedApp.updatedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space orientation="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<BarChartOutlined />}
                onClick={() => handleEnterApp(selectedApp.id)}
              >
                数据统计
              </Button>
              <Button
                block
                icon={<UserOutlined />}
                onClick={() => handleEnterApp(selectedApp.id)}
              >
                用户管理
              </Button>
              <Button
                block
                icon={<SettingOutlined />}
                onClick={() => handleEnterApp(selectedApp.id)}
              >
                应用设置
              </Button>
              <Button
                block
                icon={<ApiOutlined />}
                onClick={() => handleEnterApp(selectedApp.id)}
              >
                API 配置
              </Button>
            </Space>

            <Divider />

            <Popconfirm
              title="确定删除此应用？"
              description="删除后无法恢复"
              onConfirm={() => {
                handleDelete(selectedApp.id)
                setDrawerOpen(false)
              }}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button block danger icon={<DeleteOutlined />}>
                删除应用
              </Button>
            </Popconfirm>
          </div>
        )}
      </Drawer>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingApp ? '编辑应用' : '新建应用'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingApp ? '保存' : '创建'}
        cancelText="取消"
        width={600}
        confirmLoading={createAppMutation.isPending || updateAppMutation.isPending}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
                <Input placeholder="例如：AI Keyboard" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="icon" label="图标">
                <Input placeholder="⌨️" maxLength={4} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="slug" label="应用标识" rules={[{ required: true, message: '请输入应用标识' }]}>
            <Input placeholder="ai-keyboard" maxLength={50} />
          </Form.Item>

          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <TextArea rows={2} placeholder="简要描述..." maxLength={200} showCount />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'iOS', value: 'ios' },
                  { label: 'Android', value: 'android' },
                  { label: 'Web', value: 'web' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={[
                  { label: '运行中', value: 'active' },
                  { label: '未激活', value: 'inactive' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="bundleId" label="Bundle ID">
            <Input placeholder="com.example.myapp" maxLength={100} />
          </Form.Item>

          <Form.Item name="configTemplate" label="配置模板" tooltip="选择该应用使用的设置界面模板">
            <Select
              placeholder="选择配置模板（可选）"
              allowClear
              options={(templatesQuery.data as TemplateData[] | undefined || []).map(t => ({
                label: `${t.icon} ${t.displayName}`,
                value: t.templateId,
              }))}
              loading={templatesQuery.isLoading}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
