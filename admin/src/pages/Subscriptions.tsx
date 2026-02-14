import { useState, useMemo } from 'react'
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
  Spin,
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
import { trpc } from '@/utils/trpc'
import { useSmartLoading } from '@/hooks/useLoading'

const { RangePicker } = DatePicker

// ===== API 数据转换 =====

/**
 * 将后端状态映射到前端状态
 */
function mapBackendToFrontendStatus(backendStatus?: string): Subscription['status'] {
  if (!backendStatus) return 'active'

  const mapping: Record<string, Subscription['status']> = {
    active: 'active',
    expired: 'expired',
    cancelled: 'cancelled',
    grace_period: 'active', // 宽限期视为活跃
    trial: 'trial',
  }

  return mapping[backendStatus] || 'active'
}

/**
 * 将后端tier映射到前端tier
 */
function mapBackendToFrontendTier(backendTier?: string): Subscription['tier'] {
  if (!backendTier) return 'pro_monthly'

  const mapping: Record<string, Subscription['tier']> = {
    free: 'free',
    pro_monthly: 'pro_monthly',
    pro_yearly: 'pro_yearly',
  }

  return mapping[backendTier] || 'pro_monthly'
}

export default function SubscriptionsPage() {
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)

  const [tierFilter, setTierFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [manualLoading, setManualLoading] = useState(false)

  // 使用 tRPC 获取订阅数据
  const { data: subscriptionsData, isLoading: isLoadingSubs, refetch: refetchSubs } = trpc.subscriptionManage.listSubscriptions.useQuery(
    {
      appId: currentAppId || '',
      status: statusFilter as any,
      tier: tierFilter as any,
      limit: 100,
    },
    {
      enabled: !!currentAppId,
      refetchOnWindowFocus: false,
    }
  )

  // 使用 tRPC 获取订阅统计
  const { data: statsData, isLoading: isLoadingStats } = trpc.subscriptionManage.stats.useQuery(
    {
      appId: currentAppId || '',
    },
    {
      enabled: !!currentAppId,
      refetchOnWindowFocus: false,
    }
  )

  // 组合加载状态
  const { isLoading: smartLoading } = useSmartLoading(isLoadingSubs || isLoadingStats)
  const loading = smartLoading || manualLoading

  // 转换后端数据到前端格式
  const allSubs = useMemo(() => {
    if (!subscriptionsData) return []

    return subscriptionsData.map((sub: any) => ({
      id: sub.id,
      appId: sub.appId || currentAppId || '',
      userId: sub.userId,
      tier: mapBackendToFrontendTier(sub.tier),
      status: mapBackendToFrontendStatus(sub.status),
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew || false,
      transactionId: sub.transactionId,
      planId: sub.planId,
    }))
  }, [subscriptionsData, currentAppId])

  // 使用后端统计或计算前端统计
  const stats = useMemo(() => {
    if (statsData) {
      return {
        totalActive: statsData.active || 0,
        totalMonthly: statsData.monthly || 0,
        totalYearly: statsData.yearly || 0,
        totalTrial: statsData.trial || 0,
      }
    }

    // 如果没有后端统计，使用前端计算
    return {
      totalActive: allSubs.filter((s) => s.status === 'active').length,
      totalMonthly: allSubs.filter((s) => s.tier === 'pro_monthly' && s.status === 'active').length,
      totalYearly: allSubs.filter((s) => s.tier === 'pro_yearly' && s.status === 'active').length,
      totalTrial: allSubs.filter((s) => s.status === 'trial').length,
    }
  }, [statsData, allSubs])

  const filteredData = allSubs

  const handleRefresh = async () => {
    setManualLoading(true)
    try {
      await Promise.all([refetchSubs()])
      message.success('数据已刷新')
    } catch (error) {
      message.error('刷新失败，请重试')
    } finally {
      setManualLoading(false)
    }
  }

  const columns: ColumnsType<Subscription> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, ellipsis: true },
    { title: '用户 ID', dataIndex: 'userId', key: 'userId', width: 100, ellipsis: true },
    { title: '交易号', dataIndex: 'transactionId', key: 'transactionId', width: 150, ellipsis: true },
    {
      title: '方案',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
      filters: [
        { text: 'Pro 月度', value: 'pro_monthly' },
        { text: 'Pro 年度', value: 'pro_yearly' },
        { text: '免费', value: 'free' },
      ],
      onFilter: (value, record) => record.tier === value,
      render: (tier: string) => {
        const colors: Record<string, string> = {
          free: 'blue',
          pro_monthly: 'gold',
          pro_yearly: 'purple'
        }
        return <Tag color={colors[tier]}>{SUBSCRIPTION_TIER_LABELS[tier] || tier}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '活跃', value: 'active' },
        { text: '试用中', value: 'trial' },
        { text: '已过期', value: 'expired' },
        { text: '已取消', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={SUBSCRIPTION_STATUS_COLORS[status]}>{SUBSCRIPTION_STATUS_LABELS[status] || status}</Tag>
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
      render: (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '-',
      sorter: (a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime(),
    },
    {
      title: '到期时间',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '-',
      sorter: (a, b) => new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime(),
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

  if (!currentAppId) {
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : filteredData.length === 0 ? (
          <Empty description={currentAppId ? "暂无订阅数据" : "请先选择一个应用"} />
        ) : (
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            loading={manualLoading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              pageSize: 20,
            }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>
    </div>
  )
}
