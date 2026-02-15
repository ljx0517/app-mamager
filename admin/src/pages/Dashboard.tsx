import { Card, Row, Col, Tag, Button, Empty, Statistic, theme } from 'antd'
import {
  RightOutlined,
  AppstoreOutlined,
  UserOutlined,
  CrownOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { useAppStore } from '@/stores/appStore'
import { trpc } from '@/utils/trpc'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { apps, currentAppId, setCurrentApp } = useAppStore()

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId)
  }

  // 如果有当前应用，显示正常的仪表盘
  if (currentAppId) {
    return <DashboardView />
  }

  // 否则显示应用选择引导页
  return (
    <div>
      <PageHeader
        title="欢迎使用"
        subtitle="请选择一个应用开始管理"
        breadcrumbs={[{ title: '首页' }]}
      />

      {apps.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty
            description="暂无应用"
            extra={
              <Button type="primary" onClick={() => navigate('/apps')}>
                前往创建应用
              </Button>
            }
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {apps.map((app) => (
            <Col xs={24} sm={12} lg={8} key={app.id}>
              <Card
                hoverable
                style={{ borderRadius: 12 }}
                onClick={() => handleSelectApp(app.id)}
                actions={[
                  <Button
                    type="link"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectApp(app.id)
                    }}
                  >
                    进入管理 <RightOutlined />
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <span className="text-3xl">{app.icon}</span>
                  }
                  title={
                    <span className="flex items-center gap-2">
                      {app.name}
                      <Tag
                        color={
                          app.status === 'active'
                            ? 'green'
                            : app.status === 'maintenance'
                              ? 'orange'
                              : 'default'
                        }
                      >
                        {app.status === 'active'
                          ? '运行中'
                          : app.status === 'maintenance'
                            ? '维护中'
                            : app.status}
                      </Tag>
                    </span>
                  }
                  description={
                    <div className="mt-2">
                      <p className="text-gray-500 text-sm mb-2">
                        {app.description || '暂无描述'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Bundle ID: {app.bundleId || '-'}
                      </p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className="mt-6 text-center">
        <Button type="link" onClick={() => navigate('/apps')}>
          <AppstoreOutlined /> 管理应用
        </Button>
      </div>
    </div>
  )
}

// 原来的仪表盘视图
function DashboardView() {
  const navigate = useNavigate()
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)

  // tRPC 查询 - 实时数据快照
  const snapshotQuery = trpc.analytics.snapshot.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId, refetchOnWindowFocus: false }
  )

  // tRPC 查询 - 订阅统计
  const statsQuery = trpc.subscriptionManage.stats.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId, refetchOnWindowFocus: false }
  )

  // tRPC 查询 - 最近注册用户
  const usersQuery = trpc.userManage.list.useQuery(
    {
      appId: currentAppId!,
      limit: 5,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    { enabled: !!currentAppId }
  )

  if (!currentApp) return null

  const snapshot = snapshotQuery.data
  const stats = statsQuery.data

  return (
    <div>
      <PageHeader
        title="仪表盘"
        subtitle={`${currentApp.icon} ${currentApp.name} 运营数据概览`}
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={snapshot?.metrics.totalUsers ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日活跃"
              value={snapshot?.metrics.todayActiveUsers ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃订阅"
              value={snapshot?.metrics.activeSubscriptions ?? 0}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日 API 调用"
              value={snapshot?.metrics.todayUsage?.totalReplies ?? 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div className="text-center mt-6">
        <Button type="link" onClick={() => navigate('/users')}>
          管理用户
        </Button>
        <Button type="link" onClick={() => navigate('/subscriptions')}>
          管理订阅
        </Button>
        <Button type="link" onClick={() => navigate('/analytics')}>
          数据分析
        </Button>
      </div>
    </div>
  )
}
