/**
 * 模板相关类型定义
 */

/** 后端返回的模板类型 */
export interface TemplateInfo {
  id: string
  templateId: string
  displayName: string
  icon: string | null
  description?: string | null
  componentPath: string
  defaultConfig?: Record<string, unknown> | null
  isBuiltin: boolean
  isActive?: boolean
  sortOrder?: number
  createdAt?: string | Date
  updatedAt?: string | Date
}

/** 创建模板的输入类型 */
export interface CreateTemplateInput {
  templateId: string
  displayName: string
  icon?: string
  description?: string
  componentPath: string
  defaultConfig?: Record<string, unknown>
  isActive?: boolean
  sortOrder?: number
}

/** 更新模板的输入类型 */
export interface UpdateTemplateInput {
  id: string
  templateId?: string
  displayName?: string
  icon?: string
  description?: string
  componentPath?: string
  defaultConfig?: Record<string, unknown>
  isActive?: boolean
  sortOrder?: number
}
