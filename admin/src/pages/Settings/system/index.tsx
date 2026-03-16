import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, message, Spin } from 'antd'
import PageHeader from '@/components/PageHeader'
import AIConfig from './AIConfig'
import PaymentConfig from './PaymentConfig'
import { trpc } from '@/utils/trpc'
import { useAppStore } from '@/stores/appStore'

export default function SettingsSystemPage() {
  const [activeTab, setActiveTab] = useState('ai')
  const { appId: appIdFromParams } = useParams<{ appId?: string }>()
  const { currentAppId: currentAppIdFromStore } = useAppStore()
  // 优先使用 store 中的 currentAppId，如果为空则从 URL 参数获取
  const currentAppId = currentAppIdFromStore || appIdFromParams || null

  // 获取应用配置
  const appQuery = trpc.settings.app.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId }
  )

  const updateAppMutation = trpc.settings.updateApp.useMutation({
    onSuccess: () => {
      message.success('配置已保存')
      appQuery.refetch()
    },
    onError: (error) => {
      message.error(error.message || '保存失败')
    },
  })

  const handleSave = async (values: unknown) => {
    if (!currentAppId) {
      message.error('请先选择一个应用')
      return
    }

    // 如果是 AI 配置
    if (activeTab === 'ai' && values) {
      const aiValues = values as {
        apiKey?: string
        baseUrl?: string
        model?: string
        enableStream?: boolean
        defaultProvider?: string
      }

      // 更新 AI 提供商配置
      const rawProviders = appQuery.data?.settings?.aiProviders
      const currentProviders = Array.isArray(rawProviders) ? rawProviders : []
      const newProvider = {
        type: (aiValues.defaultProvider || 'openai') as 'openai' | 'anthropic' | 'google' | 'mock' | 'azure_openai',
        apiKey: aiValues.apiKey || '',
        baseUrl: aiValues.baseUrl || '',
        model: aiValues.model || '',
        enabled: true,
        priority: 1,
      }

      // 更新或添加提供商
      const updatedProviders = currentProviders.map((p: any) => {
        if (p.type === newProvider.type) {
          return { ...p, ...newProvider }
        }
        return p
      })

      // 如果不存在则添加
      if (!updatedProviders.find((p: any) => p.type === newProvider.type)) {
        updatedProviders.push(newProvider)
      }

      updateAppMutation.mutate({
        appId: currentAppId,
        aiProviders: updatedProviders,
        defaultAIProvider: aiValues.defaultProvider,
        enableAI: true,
      })
    }

    // 支付配置暂时不保存
    if (activeTab === 'payment') {
      message.info('支付配置保存功能开发中')
    }
  }

  // 将应用配置传递给子组件
  const firstProvider = Array.isArray(appQuery.data?.settings?.aiProviders) ? appQuery.data.settings.aiProviders[0] : undefined
  const configProps = {
    initialValues: {
      apiKey: (firstProvider as { apiKey?: string } | undefined)?.apiKey ?? '',
      baseUrl: (firstProvider as { baseUrl?: string } | undefined)?.baseUrl ?? '',
      model: (firstProvider as { model?: string } | undefined)?.model ?? '',
      defaultProvider: (appQuery.data?.settings?.defaultAIProvider as string) || 'openai',
      enableStream: false,
    },
    onSave: handleSave,
  }

  const tabItems = [
    {
      key: 'ai',
      label: 'AI 配置',
      children: appQuery.isLoading ? <Spin /> : <AIConfig {...configProps} />,
    },
    {
      key: 'payment',
      label: '支付配置',
      children: <PaymentConfig onSave={handleSave} />,
    },
    {
      key: 'integration',
      label: '第三方集成',
      children: (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          第三方集成配置开发中...
        </div>
      ),
    },
    {
      key: 'system',
      label: '系统参数',
      children: (
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          系统参数配置开发中...
        </div>
      ),
    },
  ]

  if (!currentAppId) {
    return (
      <div>
        <PageHeader
          title="系统配置"
          subtitle="全局系统参数配置"
          breadcrumbs={[{ title: '设置' }, { title: '系统配置' }]}
        />
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
          请先在左侧选择一个应用来管理其配置
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="系统配置"
        subtitle={`当前应用: ${appQuery.data?.appName || '加载中...'}`}
        breadcrumbs={[{ title: '设置' }, { title: '系统配置' }]}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
      />
    </div>
  )
}
