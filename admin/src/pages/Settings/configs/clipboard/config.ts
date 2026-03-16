/**
 * 剪贴板工具配置定义
 * 定义该 App 的配置项和业务逻辑
 */
import type { SettingsConfig } from '@/components/Settings/types'

/**
 * 剪贴板工具配置 Schema
 */
export const clipboardConfig: SettingsConfig = {
  bundleId: 'com.jaxon.clipboardtool',
  displayName: 'Clipboard Tool',
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
      section: '剪贴板历史',
      description: '配置剪贴板历史记录功能',
      items: [
        {
          key: 'enableHistory',
          type: 'toggle',
          label: '启用剪贴板历史',
          tooltip: '自动保存复制的内容到历史记录',
        },
        {
          key: 'maxHistoryCount',
          type: 'number',
          label: '最大保存条数',
          placeholder: '100',
          tooltip: '历史记录的最大保存数量',
        },
        {
          key: 'historyExpiration',
          type: 'select',
          label: '历史保留时间',
          placeholder: '选择保留时间',
          options: [
            { label: '7 天', value: 7 },
            { label: '30 天', value: 30 },
            { label: '90 天', value: 90 },
            { label: '永久', value: 0 },
          ],
        },
        {
          key: 'enableDuplicates',
          type: 'toggle',
          label: '允许重复内容',
          tooltip: '允许保存相同内容的多次复制',
        },
      ],
    },
    {
      section: '快捷粘贴',
      description: '配置快捷粘贴功能',
      items: [
        {
          key: 'enableQuickPaste',
          type: 'toggle',
          label: '启用快捷粘贴',
          tooltip: '通过快捷键快速粘贴历史内容',
        },
        {
          key: 'quickPasteKey',
          type: 'text',
          label: '快捷键',
          placeholder: '例如: Cmd+Shift+V',
          tooltip: '设置快捷粘贴的触发键',
        },
        {
          key: 'maxQuickItems',
          type: 'number',
          label: '快速粘贴列表数',
          placeholder: '9',
          tooltip: '快捷菜单中显示的最大条目数',
        },
      ],
    },
    {
      section: '云同步',
      description: '配置云同步功能',
      items: [
        {
          key: 'enableCloudSync',
          type: 'toggle',
          label: '启用云同步',
          tooltip: '跨设备同步剪贴板历史',
        },
        {
          key: 'syncWifiOnly',
          type: 'toggle',
          label: '仅 WiFi 同步',
          tooltip: '仅在 WiFi 环境下进行云同步',
        },
      ],
    },
    {
      section: '分类管理',
      description: '配置内容分类功能',
      items: [
        {
          key: 'enableCategories',
          type: 'toggle',
          label: '启用分类',
          tooltip: '将剪贴板内容自动分类',
        },
        {
          key: 'autoCategorize',
          type: 'toggle',
          label: '自动分类',
          tooltip: '根据内容自动识别分类',
        },
        {
          key: 'customCategories',
          type: 'text',
          label: '自定义分类',
          placeholder: '工作,生活,学习',
          tooltip: '自定义分类标签，用逗号分隔',
        },
      ],
    },
    {
      section: '高级设置',
      description: '高级功能配置',
      items: [
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

export default clipboardConfig
