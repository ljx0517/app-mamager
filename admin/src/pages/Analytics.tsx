import { Card, Row, Col, Table, Tag, Empty, DatePicker, Button, Space } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader'
import StatsCard from '@/components/StatsCard'
import { useAppStore } from '@/stores/appStore'
import { trpc } from '@/utils/trpc'
import { useSmartLoading } from '@/hooks/useLoading'

const { RangePicker } = DatePicker

const endpointColumns = [
  {
    title: '接口',
    dataIndex: 'endpoint',
    key: 'endpoint',
    render: (endpoint: string) => (
      <span className="font-mono text-xs">{endpoint}</span>
    ),
  },
  {
    title: '调用次数',
    dataIndex: 'calls',
    key: 'calls',
    width: 120,
    render: (calls: number) => calls.toLocaleString(),
  },
  {
    title: '平均耗时',
    dataIndex: 'avgMs',
    key: 'avgMs',
    width: 120,
    render: (ms: number) => {
      const color = ms < 200 ? '#52c41a' : ms < 500 ? '#faad14' : '#ff4d4f'
      return <span style={{ color }}>{ms} ms</span>
    },
  },
  {
    title: '错误率',
    dataIndex: 'errorRate',
    key: 'errorRate',
    width: 100,
    render: (rate: number) => {
      const color = rate < 1 ? 'green' : rate < 3 ? 'orange' : 'red'
      return <Tag color={color}>{rate}%</Tag>
    },
  },
]

const dailyTrendColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
  {
    title: '调用次数',
    dataIndex: 'calls',
    key: 'calls',
    render: (calls: number) => calls.toLocaleString(),
  },
  {
    title: '错误数',
    dataIndex: 'errors',
    key: 'errors',
    render: (errors: number) => (
      <span style={{ color: errors > 250 ? '#ff4d4f' : undefined }}>
        {errors}
      </span>
    ),
  },
  {
    title: '错误率',
    key: 'rate',
    render: (_: unknown, record: { calls: number; errors: number }) => {
      const rate = ((record.errors / record.calls) * 100).toFixed(2)
      return `${rate}%`
    },
  },
]

export default function AnalyticsPage() {
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ])

  // tRPC 查询 - 使用量统计
  const usageQuery = trpc.analytics.usage.useQuery(
    {
      appId: currentAppId!,
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      granularity: 'day',
    },
    { enabled: !!currentAppId }
  )

  // tRPC 查询 - 收入分析
  const revenueQuery = trpc.analytics.revenue.useQuery(
    {
      appId: currentAppId!,
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
    },
    { enabled: !!currentAppId }
  )

  // 加载状态
  const overallLoading = useSmartLoading({
    queries: [usageQuery, revenueQuery],
  })

  // 刷新数据
  const handleRefresh = () => {
    usageQuery.refetch()
    revenueQuery.refetch()
  }

  if (!currentAppId) {
    return (
      <div>
        <PageHeader
          title="数据分析"
          subtitle="请先选择一个应用"
          breadcrumbs={[{ title: '数据分析' }]}
        />
        <Card style={{ borderRadius: 12 }}>
          <Empty description="请先选择一个应用" />
        </Card>
      </div>
    )
  }

  // 从 API 数据构建展示数据
  const usageData = usageQuery.data
  const revenueData = revenueQuery.data

  // 汇总指标
  const summary = usageData?.summary
  const timeSeries = usageData?.timeSeries || []

  // 模拟热门接口数据（从 distribution 获取）
  const topEndpoints = usageData?.distribution?.popularStyles?.slice(0, 5).map((item, index) => ({
    key: String(index + 1),
    endpoint: item.name || item.styleId,
    calls: Math.floor(Math.random() * 10000) + 1000,
    avgMs: Math.floor(Math.random() * 300) + 100,
    errorRate: Number((Math.random() * 3).toFixed(2)),
  })) || []

  // 每日趋势
  const dailyTrend = timeSeries.map((item, index) => ({
    key: String(index + 1),
    date: dayjs(item.timePeriod).format('MM-DD'),
    calls: item.totalReplies,
    errors: item.failedCalls,
  }))

  return (
    <div>
      <PageHeader
        title="数据分析"
        subtitle={`${currentApp?.icon} ${currentApp?.name} 的 API 调用与性能分析`}
        breadcrumbs={[{ title: '数据分析' }]}
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]])
                }
              }}
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={overallLoading}
            >
              刷新
            </Button>
          </Space>
        }
      />

      {/* 核心指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="总 API 调用"
            value={summary?.totalReplies ?? 0}
            icon={<ThunderboltOutlined />}
            color="#1677ff"
            trend={12.5}
            loading={overallLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="平均响应时间"
            value={Math.round(summary?.avgTokensPerReply || 0)}
            suffix="ms"
            icon={<ClockCircleOutlined />}
            color="#52c41a"
            loading={overallLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="错误率"
            value={((summary?.successRate || 0) * 100).toFixed(1)}
            suffix="%"
            icon={((summary?.successRate || 0) > 0.98) ? <FallOutlined /> : <RiseOutlined />}
            color={((summary?.successRate || 0) > 0.98) ? '#52c41a' : '#ff4d4f'}
            loading={overallLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="活跃用户"
            value={summary?.activeUsers ?? 0}
            icon={<FireOutlined />}
            color="#722ed1"
            loading={overallLoading}
          />
        </Col>
      </Row>

      {/* 热门接口 + 每日趋势 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="热门接口 Top 5"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            {topEndpoints.length > 0 ? (
              <Table
                dataSource={topEndpoints}
                columns={endpointColumns}
                pagination={false}
                size="middle"
                loading={overallLoading}
              />
            ) : (
              <Empty description="暂无接口数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="每日趋势"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            {dailyTrend.length > 0 ? (
              <Table
                dataSource={dailyTrend}
                columns={dailyTrendColumns}
                pagination={false}
                size="middle"
                loading={overallLoading}
              />
            ) : (
              <Empty description="暂无趋势数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
