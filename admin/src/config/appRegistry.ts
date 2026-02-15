/**
 * 配置模板注册表
 * 用于动态注册和管理各 App 的配置模板
 * 支持多个 App 共用同一个配置模板
 */

// 模板设置组件类型（按需导入）

export interface ConfigTemplate {
  /** 模板唯一标识（如 ai-keyboard, ai-writer, default） */
  id: string
  /** 模板显示名称 */
  displayName: string
  /** 模板图标 */
  icon: string
  /** 模板描述 */
  description?: string
  /** 模板设置页面组件（动态加载） */
  settingsComponent: () => Promise<{ default: React.ComponentType }>
  /** 是否启用 */
  enabled: boolean
}

/**
 * 配置模板注册表
 * key: templateId
 */
export const configTemplateRegistry: Record<string, ConfigTemplate> = {}

/**
 * 注册一个配置模板
 */
export function registerConfigTemplate(template: ConfigTemplate) {
  if (configTemplateRegistry[template.id]) {
    console.warn(`配置模板 ${template.id} 已被注册，将被覆盖`)
  }
  configTemplateRegistry[template.id] = template
}

/**
 * 获取所有已注册的模板列表
 */
export function getRegisteredTemplates(): ConfigTemplate[] {
  return Object.values(configTemplateRegistry).filter(t => t.enabled)
}

/**
 * 根据模板 ID 获取模板配置
 */
export function getConfigTemplate(templateId: string): ConfigTemplate | undefined {
  return configTemplateRegistry[templateId]
}

/**
 * 检查模板是否存在
 */
export function hasConfigTemplate(templateId: string): boolean {
  const template = configTemplateRegistry[templateId]
  return !!(template?.enabled && template.settingsComponent)
}

// ===== 懒加载各模板的设置组件 =====

const templateSettingsImports = {
  'ai-keyboard': () => import('@/pages/Settings/configs/ai-keyboard'),
} as const

// ===== 注册配置模板 =====

// 注册 AI Keyboard 配置模板
registerConfigTemplate({
  id: 'ai-keyboard',
  displayName: 'AI Keyboard',
  icon: '⌨️',
  description: '智能键盘应用配置模板',
  enabled: true,
  settingsComponent: templateSettingsImports['ai-keyboard'],
})

// ===== 后续新增配置模板只需在此添加 =====
// registerConfigTemplate({
//   id: 'ai-writer',
//   displayName: 'AI Writer',
//   icon: '✍️',
//   enabled: true,
//   settingsComponent: () => import('@/pages/Settings/configs/ai-writer'),
// })

// ===== 兼容旧版本（已废弃）=====
// @deprecated 请使用 configTemplateRegistry
export const appRegistry = configTemplateRegistry

// @deprecated 请使用 registerConfigTemplate
export function registerApp(_config: { bundleId: string; displayName: string; icon: string; enabled: boolean; settingsComponent: () => Promise<{ default: React.ComponentType }> }) {
  console.warn('registerApp 已废弃，请使用 registerConfigTemplate')
}
