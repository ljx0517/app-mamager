import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Modal,
  Descriptions,
  Empty,
  message,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '@/components/PageHeader'
import { useAppStore } from '@/stores/appStore'
import type { User } from '@/types'
import {
  SUBSCRIPTION_TIER_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  PAGE_SIZE_OPTIONS,
} from '@/utils/constants'

// ===== 模拟 per-App 用户数据 =====

const generateMockUsers = (appId: string, count: number): User[] => {
  const tiers: User['subscriptionTier'][] = ['free', 'pro_monthly', 'pro_yearly']
  const statuses: User['subscriptionStatus'][] = ['active', 'expired', 'cancelled', 'trial']
  const platforms: User['platform'][] = ['ios', 'android']
  const versions: Record<string, string[]> = {
    app_001: ['1.0.0', '0.9.0', '0.8.0'],
    app_002: ['2.1.0', '2.0.5', '2.0.0'],
    app_003: ['0.5.0', '0.4.2', '0.4.0'],
  }
  const devicePrefixes: Record<string, string[]> = {
    app_001: ['iPhone15', 'iPhone14', 'iPhone16', 'iPhone13'],
    app_002: ['Pixel8', 'iPhone15', 'Samsung', 'OnePlus'],
    app_003: ['iPhone16', 'iPhone14', 'iPad'],
  }

  const appVersions = versions[appId] ?? ['1.0.0']
  const prefixes = devicePrefixes[appId] ?? ['Device']

  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    appId,
    deviceId: `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    appVersion: appVersions[Math.floor(Math.random() * appVersions.length)],
    subscriptionTier: tiers[Math.floor(Math.random() * tiers.length)],
    subscriptionStatus: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(2026, Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1).toISOString(),
    lastActiveAt: new Date(2026, 1, Math.floor(Math.random() * 10) + 1).toISOString(),
  }))
}

const mockUsersByApp: Record<string, User[]> = {
  app_001: generateMockUsers('app_001', 50),
  app_002: generateMockUsers('app_002', 35),
  app_003: generateMockUsers('app_003', 20),
}

export default function UsersPage() {
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)

  const [searchText, setSearchText] = useState('')
  const [tierFilter, setTierFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const allUsers = currentAppId ? (mockUsersByApp[currentAppId] ?? []) : []

  // 筛选数据
  const filteredUsers = allUsers.filter((user) => {
    const matchSearch = !searchText || user.deviceId.toLowerCase().includes(searchText.toLowerCase())
    const matchTier = !tierFilter || user.subscriptionTier === tierFilter
    const matchStatus = !statusFilter || user.subscriptionStatus === statusFilter
    return matchSearch && matchTier && matchStatus
  })

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 500)
  }

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setDetailOpen(true)
  }

  const handleBanUser = (user: User) => {
    Modal.confirm({
      title: '确认禁用用户',
      content: `确定要禁用设备 ${user.deviceId} 吗？禁用后该设备将无法使用 ${currentApp?.name ?? '应用'} 服务。`,
      okText: '确认禁用',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        message.success('用户已禁用')
      },
    })
  }

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '设备 ID', dataIndex: 'deviceId', key: 'deviceId', ellipsis: true },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 80,
      render: (platform: string) => <Tag color="blue">{platform.toUpperCase()}</Tag>,
    },
    { title: '版本', dataIndex: 'appVersion', key: 'appVersion', width: 80 },
    {
      title: '订阅方案',
      dataIndex: 'subscriptionTier',
      key: 'subscriptionTier',
      width: 120,
      render: (tier: string) => {
        const colors: Record<string, string> = { free: 'default', pro_monthly: 'gold', pro_yearly: 'purple' }
        return <Tag color={colors[tier]}>{SUBSCRIPTION_TIER_LABELS[tier]}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'subscriptionStatus',
      key: 'subscriptionStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={SUBSCRIPTION_STATUS_COLORS[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleBanUser(record)}>
            禁用
          </Button>
        </Space>
      ),
    },
  ]

  if (!currentApp) {
    return (
      <div>
        <PageHeader title="用户管理" subtitle="请先选择一个应用" breadcrumbs={[{ title: '用户管理' }]} />
        <Card style={{ borderRadius: 12 }}><Empty description="请先选择一个应用" /></Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="用户管理"
        subtitle={`${currentApp.icon} ${currentApp.name} 的用户数据`}
        breadcrumbs={[{ title: '用户管理' }]}
        extra={<Button icon={<ExportOutlined />}>导出</Button>}
      />

      <Card style={{ borderRadius: 12 }}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            placeholder="搜索设备 ID..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="订阅方案"
            value={tierFilter}
            onChange={setTierFilter}
            allowClear
            style={{ width: 140 }}
            options={[
              { label: '免费版', value: 'free' },
              { label: 'Pro 月度', value: 'pro_monthly' },
              { label: 'Pro 年度', value: 'pro_yearly' },
            ]}
          />
          <Select
            placeholder="订阅状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '活跃', value: 'active' },
              { label: '已过期', value: 'expired' },
              { label: '已取消', value: 'cancelled' },
              { label: '试用中', value: 'trial' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredUsers.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* 用户详情弹窗 */}
      <Modal title="用户详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {selectedUser && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="用户 ID">{selectedUser.id}</Descriptions.Item>
            <Descriptions.Item label="所属应用">{currentApp.icon} {currentApp.name}</Descriptions.Item>
            <Descriptions.Item label="设备 ID">{selectedUser.deviceId}</Descriptions.Item>
            <Descriptions.Item label="平台">{selectedUser.platform.toUpperCase()}</Descriptions.Item>
            <Descriptions.Item label="App 版本">{selectedUser.appVersion}</Descriptions.Item>
            <Descriptions.Item label="订阅方案">{SUBSCRIPTION_TIER_LABELS[selectedUser.subscriptionTier]}</Descriptions.Item>
            <Descriptions.Item label="订阅状态">
              <Tag color={SUBSCRIPTION_STATUS_COLORS[selectedUser.subscriptionStatus]}>
                {SUBSCRIPTION_STATUS_LABELS[selectedUser.subscriptionStatus]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">{new Date(selectedUser.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
            <Descriptions.Item label="最后活跃" span={2}>{new Date(selectedUser.lastActiveAt).toLocaleString('zh-CN')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
