/**
 * 管理后台通用类型定义
 * 支持多 App 管理架构
 */

// ===== App 相关 =====

/** App 平台类型 */
export type AppPlatform = 'ios' | 'android' | 'web' | 'cross_platform'

/** App 状态 */
export type AppStatus = 'active' | 'inactive' | 'maintenance' | 'archived'

/** App 信息 */
export interface AppInfo {
  id: string
  /** App 名称 */
  name: string
  /** App 标识（唯一 slug，如 ai-keyboard） */
  slug: string
  /** App 描述 */
  description: string
  /** App 图标 URL 或 emoji */
  icon: string
  /** 支持的平台 */
  platform: AppPlatform
  /** App Bundle ID (iOS) 或 Package Name (Android) */
  bundleId?: string
  /** App 状态 */
  status: AppStatus
  /** 配置模板 ID（对应 pages/Settings/configs/{templateId}） */
  configTemplate?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ===== 用户相关 =====

export interface User {
  id: string
  /** 所属 App ID */
  appId: string
  deviceId: string
  platform: 'ios' | 'android'
  appVersion: string
  subscriptionTier: 'free' | 'pro_monthly' | 'pro_yearly'
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'trial'
  createdAt: string
  lastActiveAt: string
}

// ===== 订阅相关 =====

export interface Subscription {
  id: string
  /** 所属 App ID */
  appId: string
  userId: string
  tier: 'free' | 'pro_monthly' | 'pro_yearly'
  status: 'active' | 'expired' | 'cancelled' | 'trial'
  startDate: string
  endDate: string
  autoRenew: boolean
  transactionId?: string
}

// ===== 仪表盘统计 =====

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  proUsers: number
  totalRevenue: number
  userGrowthRate: number
  conversionRate: number
}

export interface ChartDataItem {
  date: string
  value: number
  category?: string
}

// ===== 通用分页 =====

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ===== API 响应 =====

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}
