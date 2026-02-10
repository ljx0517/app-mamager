import { Card, Row, Col, Table, Tag, Empty } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import StatsCard from '@/components/StatsCard'
import { useAppStore } from '@/stores/appStore'

// ===== 模拟 per-App 分析数据 =====

const mockAnalyticsData: Record<string, {
  apiCalls: number
  avgResponseTime: number
  errorRate: number
  peakHour: string
  topEndpoints: { key: string; endpoint: string; calls: number; avgMs: number; errorRate: number }[]
  dailyTrend: { key: string; date: string; calls: number; errors: number }[]
}> = {
  app_001: {
    apiCalls: 156780,
    avgResponseTime: 245,
    errorRate: 1.2,
    peakHour: '20:00 - 22:00',
    topEndpoints: [
      { key: '1', endpoint: '/api/ai/generate', calls: 89340, avgMs: 380, errorRate: 0.8 },
      { key: '2', endpoint: '/api/styles/list', calls: 34500, avgMs: 45, errorRate: 0.1 },
      { key: '3', endpoint: '/api/user/register', calls: 12800, avgMs: 120, errorRate: 0.5 },
      { key: '4', endpoint: '/api/subscription/verify', calls: 10240, avgMs: 200, errorRate: 1.5 },
      { key: '5', endpoint: '/api/subscription/webhook', calls: 9900, avgMs: 90, errorRate: 2.1 },
    ],
    dailyTrend: [
      { key: '1', date: '02-04', calls: 21200, errors: 254 },
      { key: '2', date: '02-05', calls: 22100, errors: 210 },
      { key: '3', date: '02-06', calls: 20800, errors: 280 },
      { key: '4', date: '02-07', calls: 23400, errors: 198 },
      { key: '5', date: '02-08', calls: 24600, errors: 245 },
      { key: '6', date: '02-09', calls: 22300, errors: 267 },
      { key: '7', date: '02-10', calls: 22380, errors: 220 },
    ],
  },
  app_002: {
    apiCalls: 87650,
    avgResponseTime: 310,
    errorRate: 2.1,
    peakHour: '10:00 - 12:00',
    topEndpoints: [
      { key: '1', endpoint: '/api/translate', calls: 65200, avgMs: 420, errorRate: 1.8 },
      { key: '2', endpoint: '/api/languages', calls: 12300, avgMs: 30, errorRate: 0.0 },
      { key: '3', endpoint: '/api/history', calls: 10150, avgMs: 85, errorRate: 0.3 },
    ],
    dailyTrend: [
      { key: '1', date: '02-04', calls: 11200, errors: 230 },
      { key: '2', date: '02-05', calls: 12500, errors: 280 },
      { key: '3', date: '02-06', calls: 12800, errors: 250 },
      { key: '4', date: '02-07', calls: 13100, errors: 210 },
      { key: '5', date: '02-08', calls: 12600, errors: 260 },
      { key: '6', date: '02-09', calls: 12800, errors: 240 },
      { key: '7', date: '02-10', calls: 12650, errors: 225 },
    ],
  },
  app_003: {
    apiCalls: 34200,
    avgResponseTime: 520,
    errorRate: 3.8,
    peakHour: '14:00 - 16:00',
    topEndpoints: [
      { key: '1', endpoint: '/api/write/generate', calls: 24100, avgMs: 680, errorRate: 3.2 },
      { key: '2', endpoint: '/api/templates', calls: 6800, avgMs: 55, errorRate: 0.1 },
      { key: '3', endpoint: '/api/write/improve', calls: 3300, avgMs: 450, errorRate: 5.8 },
    ],
    dailyTrend: [
      { key: '1', date: '02-04', calls: 4800, errors: 180 },
      { key: '2', date: '02-05', calls: 5100, errors: 195 },
      { key: '3', date: '02-06', calls: 4900, errors: 210 },
      { key: '4', date: '02-07', calls: 5200, errors: 175 },
      { key: '5', date: '02-08', calls: 4700, errors: 190 },
      { key: '6', date: '02-09', calls: 4800, errors: 200 },
      { key: '7', date: '02-10', calls: 4700, errors: 180 },
    ],
  },
}

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
    sorter: (a: { calls: number }, b: { calls: number }) => a.calls - b.calls,
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
    sorter: (a: { avgMs: number }, b: { avgMs: number }) => a.avgMs - b.avgMs,
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
    sorter: (a: { errorRate: number }, b: { errorRate: number }) => a.errorRate - b.errorRate,
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
  const data = currentAppId ? mockAnalyticsData[currentAppId] : null

  if (!currentApp || !data) {
    return (
      <div>
        <PageHeader
          title="数据分析"
          subtitle="请先选择一个应用"
          breadcrumbs={[{ title: '数据分析' }]}
        />
        <Card style={{ borderRadius: 12 }}>
          <Empty description="暂无该应用的分析数据" />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="数据分析"
        subtitle={`${currentApp.icon} ${currentApp.name} 的 API 调用与性能分析`}
        breadcrumbs={[{ title: '数据分析' }]}
      />

      {/* 核心指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="总 API 调用"
            value={data.apiCalls}
            icon={<ThunderboltOutlined />}
            color="#1677ff"
            trend={12.5}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="平均响应时间"
            value={data.avgResponseTime}
            suffix="ms"
            icon={<ClockCircleOutlined />}
            color={data.avgResponseTime < 300 ? '#52c41a' : '#faad14'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="错误率"
            value={data.errorRate}
            suffix="%"
            icon={data.errorRate < 2 ? <FallOutlined /> : <RiseOutlined />}
            color={data.errorRate < 2 ? '#52c41a' : '#ff4d4f'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="高峰时段"
            value={data.peakHour}
            icon={<FireOutlined />}
            color="#722ed1"
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
            <Table
              dataSource={data.topEndpoints}
              columns={endpointColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="近 7 天趋势"
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={data.dailyTrend}
              columns={dailyTrendColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
