# Admin 前端接口需求文档

本文档列出 admin 前端从模拟数据迁移到真实接口所需的全部 API 调用。

---

## 一、当前模拟数据使用情况

| 文件 | 模拟数据变量 | 用途 |
|------|-------------|------|
| `src/stores/appStore.ts` | `MOCK_APPS` | 应用列表 |
| `src/pages/Dashboard.tsx` | `mockDashboardData` | 仪表盘数据 |
| `src/pages/Analytics.tsx` | `mockAnalyticsData` | 数据分析 |
| `src/pages/Settings.tsx` | `mockConfigByApp` | 应用配置 |

---

## 二、所需接口清单

### 1. 应用列表 (`appStore.ts`)

**当前**: 使用 `MOCK_APPS` 静态数据

**需要替换为**:
| 接口 | 类型 | 说明 |
|------|------|------|
| `app.list` | query | 获取所有应用列表 |

**调用示例**:
```typescript
const appsQuery = trpc.app.list.useQuery()
```

---

### 2. 仪表盘 (`Dashboard.tsx`)

**当前**: 使用 `mockDashboardData` 模拟数据

**需要替换为**:

| 接口 | 类型 | 参数 | 返回值用途 |
|------|------|------|-----------|
| `analytics.snapshot` | query | `appId: string` | 实时数据快照（用户数、活跃数、订阅数、收入等）|
| `subscriptionManage.stats` | query | `appId: string` | 订阅统计数据（按状态、按套餐分组）|
| `userManage.list` | query | `appId, limit, offset` | 用户列表（最近注册用户）|

**调用示例**:
```typescript
// 实时快照
const snapshotQuery = trpc.analytics.snapshot.useQuery({ appId })

// 订阅统计
const statsQuery = trpc.subscriptionManage.stats.useQuery({ appId })

// 用户列表
const usersQuery = trpc.userManage.list.useQuery({
  appId,
  limit: 5,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})
```

---

### 3. 数据分析 (`Analytics.tsx`)

**当前**: 使用 `mockAnalyticsData` 模拟数据

**需要替换为**:

| 接口 | 类型 | 参数 | 返回值用途 |
|------|------|------|-----------|
| `analytics.usage` | query | `appId, startDate, endDate, granularity` | API 调用统计、热门接口 |
| `analytics.revenue` | query | `appId, startDate, endDate` | 收入分析 |
| `analytics.growth` | query | `appId, periods, periodType` | 用户增长与留存 |

**调用示例**:
```typescript
// 使用量统计
const usageQuery = trpc.analytics.usage.useQuery({
  appId,
  startDate: '2026-01-01',
  endDate: '2026-02-14',
  granularity: 'day'
})

// 收入分析
const revenueQuery = trpc.analytics.revenue.useQuery({
  appId,
  startDate: '2026-01-01',
  endDate: '2026-02-14'
})

// 用户增长
const growthQuery = trpc.analytics.growth.useQuery({
  appId,
  periods: 7,
  periodType: 'day'
})
```

---

### 4. 应用设置 (`Settings.tsx`)

**当前**: 使用 `mockConfigByApp` 模拟数据

**需要替换为**:

| 接口 | 类型 | 参数 | 返回值用途 |
|------|------|------|-----------|
| `settings.app` | query | `appId: string` | 获取应用配置 |
| `settings.updateApp` | mutation | `appId, settings...` | 更新应用配置 |
| `settings.listApps` | query | 无参数 | 获取所有应用配置摘要 |

**调用示例**:
```typescript
// 获取应用配置
const settingsQuery = trpc.settings.app.useQuery({ appId })

// 更新应用配置
const updateMutation = trpc.settings.updateApp.useMutation({
  onSuccess: () => {
    message.success('配置已保存')
  }
})

// 调用更新
updateMutation.mutate({
  appId,
  freeReplyLimitPerDay: 10,
  enableAI: true
})
```

---

### 5. 用户管理 (`Users.tsx`)

**当前**: 可能使用模拟数据

**需要替换为**:

| 接口 | 类型 | 参数 | 返回值用途 |
|------|------|------|-----------|
| `userManage.list` | query | `appId, search, status, limit, offset, sortBy, sortOrder` | 用户列表（分页、搜索、筛选）|
| `userManage.detail` | query | `userId: string` | 用户详情 |

**调用示例**:
```typescript
const usersQuery = trpc.userManage.list.useQuery({
  appId,
  search: keyword,
  status: filterStatus,
  limit: 20,
  offset: (page - 1) * 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})
```

---

### 6. 订阅管理 (`Subscriptions.tsx`)

**当前**: 可能使用模拟数据

**需要替换为**:

| 接口 | 类型 | 参数 | 返回值用途 |
|------|------|------|-----------|
| `subscriptionManage.listPlans` | query | `appId` | 订阅计划列表 |
| `subscriptionManage.listSubscriptions` | query | `appId, status, tier, limit, offset` | 用户订阅列表 |
| `subscriptionManage.createPlan` | mutation | `appId, name, productId, tier, billingPeriod, priceCents, durationDays...` | 创建订阅计划 |
| `subscriptionManage.updatePlan` | mutation | `planId, ...fields` | 更新订阅计划 |
| `subscriptionManage.deletePlan` | mutation | `planId: string` | 删除订阅计划 |
| `subscriptionManage.activateSubscription` | mutation | `userId, planId, durationDays` | 激活订阅 |
| `subscriptionManage.cancelSubscription` | mutation | `subscriptionId, reason` | 取消订阅 |
| `subscriptionManage.extendSubscription` | mutation | `subscriptionId, extraDays, reason` | 延长订阅 |

---

## 三、接口参数与返回值详情

### app.list

**参数**: 无

**返回值**:
```typescript
Array<{
  id: string
  name: string
  bundleId: string
  platform: "ios" | "android" | "web"
  description: string | null
  apiKey: string
  apiSecret: string
  status: "active" | "inactive" | "maintenance" | "archived"
  createdAt: Date
  updatedAt: Date
}>
```

---

### analytics.snapshot

**参数**:
```typescript
{
  appId: string  // UUID 格式
}
```

**返回值**:
```typescript
{
  timestamp: string
  metrics: {
    totalUsers: number
    todayActiveUsers: number
    activeSubscriptions: number
    revenueToday: number
    todayUsage: {
      totalReplies: number
      totalTokens: number
      successRate: number
    }
  }
  health: {
    database: boolean
    aiServices: boolean
    rateLimiting: boolean
  }
}
```

---

### subscriptionManage.stats

**参数**:
```typescript
{
  appId: string  // UUID 格式
}
```

**返回值**:
```typescript
{
  totalUsers: number
  activePlans: number
  byStatus: {
    active: number
    expired: number
    cancelled: number
    gracePeriod: number
  }
  byTier: {
    free: number
    proMonthly: number
    proYearly: number
  }
  conversionRate: string  // 如 "0.0500"
}
```

---

### userManage.list

**参数**:
```typescript
{
  appId: string
  search?: string
  status?: "active" | "disabled" | "suspended" | "pending_verification"
  emailVerified?: boolean
  subscriptionTier?: "free" | "pro_monthly" | "pro_yearly"
  sortBy?: "createdAt" | "lastLoginAt" | "email" | "deviceId"
  sortOrder?: "asc" | "desc"
  limit?: number  // 默认 50, 最大 100
  offset?: number  // 默认 0
}
```

**返回值**:
```typescript
{
  items: Array<{
    user: {
      id: string
      deviceId: string
      email: string | null
      emailVerified: boolean
      status: string
      createdAt: Date
      lastLoginAt: Date | null
    }
    subscription: {
      id: string
      tier: string
      status: string
      expiresAt: Date | null
    } | null
    hasActiveSubscription: boolean
  }>
  total: number
  limit: number
  offset: number
  hasMore: boolean
}
```

---

### analytics.usage

**参数**:
```typescript
{
  appId: string
  startDate: string  // YYYY-MM-DD 格式
  endDate: string   // YYYY-MM-DD 格式
  granularity?: "day" | "week" | "month"
  groupByTier?: boolean
  groupByProvider?: boolean
}
```

**返回值**:
```typescript
{
  timeSeries: Array<{
    timePeriod: Date
    totalReplies: number
    totalTokens: number
    successfulCalls: number
    failedCalls: number
    uniqueUsers: number
    successRate: number
  }>
  summary: {
    totalUsers: number
    activeUsers: number
    totalReplies: number
    totalTokens: number
    avgTokensPerReply: number
    successRate: number
  }
  distribution: {
    byTier: Record<string, number>
    byProvider: Record<string, number>
    popularStyles: Array<{ styleId: string; name: string; count: number }>
  }
}
```

---

### settings.app

**参数**:
```typescript
{
  appId: string
}
```

**返回值**:
```typescript
{
  appId: string
  appName: string
  settings: {
    freeReplyLimitPerDay: number
    freeCandidateCount: number
    proCandidateCount: number
    enableAI: boolean
    enableSubscription: boolean
    aiProviders: Array<{
      type: string
      apiKey?: string
      baseUrl?: string
      model?: string
      enabled: boolean
      priority: number
    }>
    defaultAIProvider: string
  }
  platform: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

### settings.updateApp

**参数**:
```typescript
{
  appId: string
  freeReplyLimitPerDay?: number
  freeCandidateCount?: number
  proCandidateCount?: number
  enableAI?: boolean
  enableSubscription?: boolean
  aiProviders?: Array<{...}>
  defaultAIProvider?: string
}
```

**返回值**:
```typescript
{
  appId: string
  appName: string
  settings: { /* 更新后的设置 */ }
  message: "应用配置更新成功"
}
```

---

## 四、前端调用示例

### 完整改造示例 (Dashboard)

```typescript
import { trpc } from '@/utils/trpc'
import { useAppStore } from '@/stores/appStore'

export default function DashboardPage() {
  const { currentAppId } = useAppStore()

  // 并行请求多个数据源
  const snapshotQuery = trpc.analytics.snapshot.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId }
  )

  const statsQuery = trpc.subscriptionManage.stats.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId }
  )

  const usersQuery = trpc.userManage.list.useQuery(
    {
      appId: currentAppId!,
      limit: 5,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    { enabled: !!currentAppId }
  )

  const loading = snapshotQuery.isLoading || statsQuery.isLoading || usersQuery.isLoading

  if (loading) return <Loading />

  // 使用真实数据
  const snapshot = snapshotQuery.data
  const stats = statsQuery.data
  const recentUsers = usersQuery.data?.items || []

  return (
    <div>
      {/* 统计数据卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <StatsCard title="总用户" value={snapshot?.metrics.totalUsers} />
        </Col>
        <Col span={6}>
          <StatsCard title="今日活跃" value={snapshot?.metrics.todayActiveUsers} />
        </Col>
        <Col span={6}>
          <StatsCard title="活跃订阅" value={stats?.byStatus.active} />
        </Col>
        <Col span={6}>
          <StatsCard title="今日收入" value={snapshot?.metrics.revenueToday} prefix="¥" />
        </Col>
      </Row>
    </div>
  )
}
```

---

## 五、注意事项

1. **App 隔离**: 所有接口都需要 `appId` 参数，通过 `x-app-id` 请求头或输入参数传递
2. **认证**: 管理后台接口需要管理员登录 Token
3. **分页**: 列表接口支持 `limit` 和 `offset` 参数
4. **错误处理**: 使用 mutation 的 `onError` 回调处理错误
5. **加载状态**: 使用 `isLoading`, `isFetching` 判断请求状态
