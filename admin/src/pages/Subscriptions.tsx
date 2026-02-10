import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Select,
  Row,
  Col,
  Button,
  Space,
  DatePicker,
  Empty,
  message,
} from 'antd'
import {
  ReloadOutlined,
  ExportOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '@/components/PageHeader'
import StatsCard from '@/components/StatsCard'
import { useAppStore } from '@/stores/appStore'
import type { Subscription } from '@/types'
import {
  SUBSCRIPTION_TIER_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
} from '@/utils/constants'

const { RangePicker } = DatePicker

// ===== 模拟 per-App 订阅数据 =====

const generateMockSubscriptions = (appId: string, count: number): Subscription[] => {
  const tiers: Subscription['tier'][] = ['pro_monthly', 'pro_yearly']
  const statuses: Subscription['status'][] = ['active', 'expired', 'cancelled', 'trial']

  return Array.from({ length: count }, (_, i) => {
    const startDate = new Date(2026, Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1)
    const endDate = new Date(startDate)
    const tier = tiers[Math.floor(Math.random() * tiers.length)]
    endDate.setMonth(endDate.getMonth() + (tier === 'pro_yearly' ? 12 : 1))

    return {
      id: String(i + 1),
      appId,
      userId: String(Math.floor(Math.random() * 50) + 1),
      tier,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: Math.random() > 0.3,
      transactionId: `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    }
  })
}

const mockSubsByApp: Record<string, Subscription[]> = {
  app_001: generateMockSubscriptions('app_001', 40),
  app_002: generateMockSubscriptions('app_002', 25),
  app_003: generateMockSubscriptions('app_003', 12),
}

export default function SubscriptionsPage() {
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)

  const [tierFilter, setTierFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const allSubs = currentAppId ? (mockSubsByApp[currentAppId] ?? []) : []

  const stats = {
    totalActive: allSubs.filter((s) => s.status === 'active').length,
    totalMonthly: allSubs.filter((s) => s.tier === 'pro_monthly' && s.status === 'active').length,
    totalYearly: allSubs.filter((s) => s.tier === 'pro_yearly' && s.status === 'active').length,
    totalTrial: allSubs.filter((s) => s.status === 'trial').length,
  }

  const filteredData = allSubs.filter((sub) => {
    const matchTier = !tierFilter || sub.tier === tierFilter
    const matchStatus = !statusFilter || sub.status === statusFilter
    return matchTier && matchStatus
  })

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 500)
  }

  const columns: ColumnsType<Subscription> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户 ID', dataIndex: 'userId', key: 'userId', width: 80 },
    { title: '交易号', dataIndex: 'transactionId', key: 'transactionId', ellipsis: true },
    {
      title: '方案',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
      render: (tier: string) => {
        const colors: Record<string, string> = { pro_monthly: 'gold', pro_yearly: 'purple' }
        return <Tag color={colors[tier]}>{SUBSCRIPTION_TIER_LABELS[tier]}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={SUBSCRIPTION_STATUS_COLORS[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '自动续费',
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      width: 100,
      render: (v: boolean) => v ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    },
    {
      title: '到期时间',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
    },
  ]

  if (!currentApp) {
    return (
      <div>
        <PageHeader title="订阅管理" subtitle="请先选择一个应用" breadcrumbs={[{ title: '订阅管理' }]} />
        <Card style={{ borderRadius: 12 }}><Empty description="请先选择一个应用" /></Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="订阅管理"
        subtitle={`${currentApp.icon} ${currentApp.name} 的订阅数据`}
        breadcrumbs={[{ title: '订阅管理' }]}
        extra={<Button icon={<ExportOutlined />}>导出报告</Button>}
      />

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="活跃订阅" value={stats.totalActive} icon={<CheckCircleOutlined />} color="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="月度会员" value={stats.totalMonthly} icon={<CrownOutlined />} color="#faad14" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="年度会员" value={stats.totalYearly} icon={<CrownOutlined />} color="#722ed1" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="试用用户" value={stats.totalTrial} icon={<ClockCircleOutlined />} color="#1677ff" />
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select
            placeholder="订阅方案"
            value={tierFilter}
            onChange={setTierFilter}
            allowClear
            style={{ width: 140 }}
            options={[
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
          <RangePicker placeholder={['开始日期', '结束日期']} />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          </Space>
        </div>

        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录` }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>
    </div>
  )
}
