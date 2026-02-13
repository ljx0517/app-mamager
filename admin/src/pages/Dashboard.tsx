import { Row, Col, Card, Table, Tag, theme, Empty, Button } from 'antd'
import {
  UserOutlined,
  CrownOutlined,
  RiseOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import React, { useState, useEffect } from 'react'
import { useSmartLoading } from '@/hooks/useLoading'
import Loading, { ContentLoading, TableLoading } from '@/components/Loading'
import PageHeader from '@/components/PageHeader'
import StatsCard from '@/components/StatsCard'
import { useAppStore } from '@/stores/appStore'
import type { User } from '@/types'
import {
  SUBSCRIPTION_TIER_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
} from '@/utils/constants'
import { trpc } from '@/utils/trpc'

// ===== 模拟 per-App 仪表盘数据 =====

const mockDashboardData: Record<string, {
  stats: { totalUsers: number; activeUsers: number; proUsers: number; totalRevenue: number }
  recentUsers: User[]
  todayBrief: { newUsers: number; apiCalls: number; newSubs: number; cancelSubs: number }
}> = {
  app_001: {
    stats: { totalUsers: 12846, activeUsers: 8923, proUsers: 3214, totalRevenue: 98520 },
    recentUsers: [
      { id: '1', appId: 'app_001', deviceId: 'iPhone15-A1B2C3', platform: 'ios', appVersion: '1.0.0', subscriptionTier: 'pro_monthly', subscriptionStatus: 'active', createdAt: '2026-02-10T08:30:00Z', lastActiveAt: '2026-02-10T09:15:00Z' },
      { id: '2', appId: 'app_001', deviceId: 'iPhone14-D4E5F6', platform: 'ios', appVersion: '1.0.0', subscriptionTier: 'free', subscriptionStatus: 'active', createdAt: '2026-02-09T14:20:00Z', lastActiveAt: '2026-02-10T07:45:00Z' },
      { id: '3', appId: 'app_001', deviceId: 'iPhone16-G7H8I9', platform: 'ios', appVersion: '1.0.0', subscriptionTier: 'pro_yearly', subscriptionStatus: 'active', createdAt: '2026-02-08T10:10:00Z', lastActiveAt: '2026-02-10T06:30:00Z' },
      { id: '4', appId: 'app_001', deviceId: 'iPhone13-J0K1L2', platform: 'ios', appVersion: '0.9.0', subscriptionTier: 'pro_monthly', subscriptionStatus: 'cancelled', createdAt: '2026-01-15T09:00:00Z', lastActiveAt: '2026-02-05T18:20:00Z' },
      { id: '5', appId: 'app_001', deviceId: 'iPhone15-M3N4O5', platform: 'ios', appVersion: '1.0.0', subscriptionTier: 'free', subscriptionStatus: 'trial', createdAt: '2026-02-10T03:45:00Z', lastActiveAt: '2026-02-10T09:30:00Z' },
    ],
    todayBrief: { newUsers: 128, apiCalls: 23456, newSubs: 36, cancelSubs: 5 },
  },
  app_002: {
    stats: { totalUsers: 8320, activeUsers: 5610, proUsers: 1890, totalRevenue: 56200 },
    recentUsers: [
      { id: '1', appId: 'app_002', deviceId: 'Pixel8-X1Y2Z3', platform: 'android', appVersion: '2.1.0', subscriptionTier: 'pro_yearly', subscriptionStatus: 'active', createdAt: '2026-02-10T07:20:00Z', lastActiveAt: '2026-02-10T08:40:00Z' },
      { id: '2', appId: 'app_002', deviceId: 'iPhone15-P6Q7R8', platform: 'ios', appVersion: '2.1.0', subscriptionTier: 'free', subscriptionStatus: 'trial', createdAt: '2026-02-09T16:00:00Z', lastActiveAt: '2026-02-10T06:10:00Z' },
      { id: '3', appId: 'app_002', deviceId: 'Samsung-S9T0U1', platform: 'android', appVersion: '2.0.5', subscriptionTier: 'pro_monthly', subscriptionStatus: 'active', createdAt: '2026-02-08T12:30:00Z', lastActiveAt: '2026-02-09T22:15:00Z' },
    ],
    todayBrief: { newUsers: 85, apiCalls: 15230, newSubs: 22, cancelSubs: 3 },
  },
  app_003: {
    stats: { totalUsers: 3450, activeUsers: 2100, proUsers: 680, totalRevenue: 18900 },
    recentUsers: [
      { id: '1', appId: 'app_003', deviceId: 'iPhone16-V2W3X4', platform: 'ios', appVersion: '0.5.0', subscriptionTier: 'free', subscriptionStatus: 'active', createdAt: '2026-02-10T05:15:00Z', lastActiveAt: '2026-02-10T07:00:00Z' },
      { id: '2', appId: 'app_003', deviceId: 'iPhone14-Y5Z6A7', platform: 'ios', appVersion: '0.5.0', subscriptionTier: 'pro_monthly', subscriptionStatus: 'trial', createdAt: '2026-02-09T20:40:00Z', lastActiveAt: '2026-02-10T03:30:00Z' },
    ],
    todayBrief: { newUsers: 32, apiCalls: 5420, newSubs: 8, cancelSubs: 1 },
  },
}

// ===== 表格列 =====

const recentUserColumns = [
  { title: '设备 ID', dataIndex: 'deviceId', key: 'deviceId', ellipsis: true },
  {
    title: '平台',
    dataIndex: 'platform',
    key: 'platform',
    width: 80,
    render: (platform: string) => <Tag color="blue">{platform.toUpperCase()}</Tag>,
  },
  {
    title: '订阅方案',
    dataIndex: 'subscriptionTier',
    key: 'subscriptionTier',
    width: 120,
    render: (tier: string) => SUBSCRIPTION_TIER_LABELS[tier] ?? tier,
  },
  {
    title: '状态',
    dataIndex: 'subscriptionStatus',
    key: 'subscriptionStatus',
    width: 100,
    render: (status: string) => (
      <Tag color={SUBSCRIPTION_STATUS_COLORS[status]}>
        {SUBSCRIPTION_STATUS_LABELS[status] ?? status}
      </Tag>
    ),
  },
  {
    title: '注册时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 120,
    render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
  },
]

// ===== 页面组件 =====

export default function DashboardPage() {
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)
  const { token } = theme.useToken()

  // tRPC 查询
  const statsQuery = trpc.subscriptionManage.stats.useQuery(
    { appId: currentAppId || '' },
    { enabled: !!currentAppId, refetchOnWindowFocus: false }
  )

  // 组合所有加载状态
  const overallLoading = useSmartLoading({
    queries: [statsQuery],
  })

  // 计算dashboard数据
  const dashboardData = React.useMemo(() => {
    if (!currentAppId) return null

    // 如果有API数据，使用API数据
    if (statsQuery.data) {
      const apiStats = statsQuery.data
      return {
        stats: {
          totalUsers: apiStats.totalUsers,
          activeUsers: apiStats.byStatus.active || 0,
          proUsers: (apiStats.byTier.proMonthly || 0) + (apiStats.byTier.proYearly || 0),
          totalRevenue: 98520, // 暂时保留模拟数据，未来可从API获取
        },
        // 暂时保留模拟数据
        recentUsers: mockDashboardData[currentAppId]?.recentUsers || [],
        todayBrief: mockDashboardData[currentAppId]?.todayBrief || { newUsers: 0, apiCalls: 0, newSubs: 0, cancelSubs: 0 },
      }
    }

    // 如果没有API数据但有模拟数据，使用模拟数据
    if (mockDashboardData[currentAppId]) {
      return mockDashboardData[currentAppId]
    }

    return null
  }, [currentAppId, statsQuery.data])

  // 刷新数据
  const handleRefresh = () => {
    statsQuery.refetch()
  }

  if (!currentApp || !dashboardData) {
    return (
      <div>
        <PageHeader title="仪表盘" subtitle="请先在左侧选择一个应用" />
        <Card style={{ borderRadius: 12 }}>
          <Empty description="请先选择一个应用以查看数据" />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="仪表盘"
        subtitle={`${currentApp.icon} ${currentApp.name} 运营数据概览`}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={overallLoading}
          >
            刷新数据
          </Button>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="总用户数"
            value={dashboardData.stats.totalUsers}
            icon={<TeamOutlined />}
            color="#1677ff"
            trend={12.5}
            loading={overallLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="活跃用户"
            value={dashboardData.stats.activeUsers}
            icon={<UserOutlined />}
            color="#52c41a"
            trend={8.3}
            loading={overallLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Pro 会员"
            value={dashboardData.stats.proUsers}
            icon={<CrownOutlined />}
            color="#faad14"
            trend={25.0}
            loading={overallLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="总收入"
            value={dashboardData.stats.totalRevenue}
            prefix={<DollarOutlined />}
            icon={<RiseOutlined />}
            color="#722ed1"
            trend={18.2}
            loading={overallLoading}
          />
        </Col>
      </Row>

      {/* 今日快报 + 最近注册 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
            <div className="flex items-center gap-3 mb-4">
              <ThunderboltOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
              <span className="font-medium" style={{ color: token.colorText }}>
                今日快报
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between" style={{ color: token.colorTextSecondary }}>
                <span>今日新增用户</span>
                <span className="font-medium" style={{ color: token.colorText }}>{dashboardData.todayBrief.newUsers}</span>
              </div>
              <div className="flex justify-between" style={{ color: token.colorTextSecondary }}>
                <span>今日 API 调用</span>
                <span className="font-medium" style={{ color: token.colorText }}>{dashboardData.todayBrief.apiCalls.toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ color: token.colorTextSecondary }}>
                <span>今日新增订阅</span>
                <span className="font-medium" style={{ color: token.colorText }}>{dashboardData.todayBrief.newSubs}</span>
              </div>
              <div className="flex justify-between" style={{ color: token.colorTextSecondary }}>
                <span>今日取消订阅</span>
                <span className="font-medium" style={{ color: token.colorText }}>{dashboardData.todayBrief.cancelSubs}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title="最近注册用户"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={dashboardData.recentUsers}
              columns={recentUserColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              loading={overallLoading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
