/**
 * 管理后台常量配置
 * 多 App 通用管理平台
 */

/** 平台名称 */
export const PLATFORM_NAME = '应用管理平台'

/** 版本号 */
export const APP_VERSION = '0.2.0'

/** 订阅等级标签 */
export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  free: '免费版',
  pro_monthly: 'Pro 月度',
  pro_yearly: 'Pro 年度',
}

/** 订阅状态标签 */
export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: '活跃',
  expired: '已过期',
  cancelled: '已取消',
  trial: '试用中',
}

/** 订阅状态颜色 */
export const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  expired: 'default',
  cancelled: 'red',
  trial: 'blue',
}

/** App 状态标签 */
export const APP_STATUS_LABELS: Record<string, string> = {
  active: '运行中',
  inactive: '未激活',
  maintenance: '维护中',
  archived: '已归档',
}

/** App 状态颜色 */
export const APP_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  maintenance: 'orange',
  archived: 'red',
}

/** App 平台标签 */
export const APP_PLATFORM_LABELS: Record<string, string> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
  cross_platform: '跨平台',
}

/** App 平台颜色 */
export const APP_PLATFORM_COLORS: Record<string, string> = {
  ios: 'blue',
  android: 'green',
  web: 'purple',
  cross_platform: 'cyan',
}

/** 每页条数选项 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
