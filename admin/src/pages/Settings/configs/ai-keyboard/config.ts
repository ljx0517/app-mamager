/**
 * AI Keyboard 专属配置定义
 * 定义该 App 的配置项和业务逻辑
 */
import type { SettingsConfig } from '@/components/Settings/types'
import { KeyboardFeaturePanel } from './components/KeyboardFeaturePanel'
import { SubscriptionPlansPanel } from './components/SubscriptionPlansPanel'

/**
 * AI Keyboard 配置 Schema
 */
export const aiKeyboardConfig: SettingsConfig = {
  bundleId: 'com.jaxon.aikeyboard',
  displayName: 'AI Keyboard',
  settings: [
    {
      section: '基础信息',
      description: 'App 的基本信息配置',
      items: [
        {
          key: 'appName',
          type: 'text',
          label: '应用名称',
          placeholder: '请输入应用名称',
        },
        {
          key: 'bundleId',
          type: 'text',
          label: 'Bundle ID',
          disabled: true,
          tooltip: 'iOS 应用唯一标识符，不可修改',
        },
      ],
    },
    {
      section: '键盘功能',
      description: '配置键盘核心功能开关',
      type: 'custom',
      component: KeyboardFeaturePanel,
    },
    {
      section: '订阅计划',
      description: '配置用户的订阅方案和权益',
      type: 'custom',
      component: SubscriptionPlansPanel,
    },
    {
      section: 'API 配置',
      description: 'AI 服务 API 相关配置',
      items: [
        {
          key: 'defaultAIProvider',
          type: 'select',
          label: '默认 AI 提供商',
          placeholder: '选择默认 AI 服务商',
          options: [
            { label: 'OpenAI', value: 'openai' },
            { label: 'Anthropic Claude', value: 'claude' },
            { label: 'Google Gemini', value: 'gemini' },
            { label: '自定义', value: 'custom' },
          ],
        },
        {
          key: 'apiEndpoint',
          type: 'text',
          label: 'API 端点',
          placeholder: 'https://api.example.com/v1',
          tooltip: '自定义 API 端点地址',
        },
        {
          key: 'apiKey',
          type: 'text',
          label: 'API Key',
          placeholder: 'sk-xxxxxxxx',
          tooltip: 'AI 服务的 API 密钥',
        },
      ],
    },
    {
      section: '配额限制',
      description: '用户使用配额配置',
      items: [
        {
          key: 'freeReplyLimitPerDay',
          type: 'number',
          label: '免费版日配额',
          placeholder: '每日免费回复次数',
          tooltip: '免费用户每天可使用的 AI 回复次数',
        },
        {
          key: 'freeCandidateCount',
          type: 'number',
          label: '免费版候选数',
          placeholder: '候选词数量',
          tooltip: '免费用户每次显示的候选词数量',
        },
        {
          key: 'proCandidateCount',
          type: 'number',
          label: 'Pro 版候选数',
          placeholder: 'Pro 版候选词数量',
          tooltip: 'Pro 用户每次显示的候选词数量',
        },
      ],
    },
    {
      section: '高级设置',
      description: '高级功能配置',
      items: [
        {
          key: 'enableCloudSync',
          type: 'toggle',
          label: '启用云同步',
          tooltip: '允许用户同步个人词库和设置到云端',
        },
        {
          key: 'enableAnalytics',
          type: 'toggle',
          label: '启用数据分析',
          tooltip: '收集使用数据以优化产品',
        },
        {
          key: 'logLevel',
          type: 'select',
          label: '日志级别',
          options: [
            { label: 'Debug', value: 'debug' },
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warn' },
            { label: 'Error', value: 'error' },
          ],
        },
      ],
    },
  ],
}

export default aiKeyboardConfig
