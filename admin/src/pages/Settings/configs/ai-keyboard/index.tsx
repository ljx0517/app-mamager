/**
 * AI Keyboard 设置页面入口
 * com.jaxon.aikeyboard 专属配置页面
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Empty, Spin, message, Alert } from 'antd'
import PageHeader from '@/components/PageHeader'
import { SettingsForm } from '@/components/Settings'
import { aiKeyboardConfig } from './config'
import { useAppStore } from '@/stores/appStore'
import { trpc } from '@/utils/trpc'

export default function AIKeyboardSettingsPage() {
  const { bundleId } = useParams<{ bundleId: string }>()
  const { apps, currentAppId } = useAppStore()
  const currentApp = apps.find((a) => a.id === currentAppId)

  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  // 路由参数中的 bundleId 与当前 app 不匹配
  if (bundleId && bundleId !== 'com.jaxon.aikeyboard') {
    return (
      <div>
        <PageHeader
          title="应用设置"
          subtitle="应用配置不匹配"
          breadcrumbs={[{ title: '应用设置' }]}
        />
        <Alert
          message="配置错误"
          description="当前应用的 bundleId 与配置不匹配"
          type="error"
          showIcon
        />
      </div>
    )
  }

  // tRPC - 获取应用配置
  const settingsQuery = trpc.settings.app.useQuery(
    { appId: currentAppId! },
    { enabled: !!currentAppId }
  )

  // tRPC - 更新应用配置
  const updateSettingsMutation = trpc.settings.updateApp.useMutation({
    onSuccess: () => {
      message.success('配置已保存')
      settingsQuery.refetch()
    },
    onError: (error) => {
      message.error(error.message || '保存失败')
    },
    onSettled: () => {
      setSaving(false)
    },
  })

  // 加载配置数据
  useEffect(() => {
    if (settingsQuery.data?.settings) {
      setFormValues(settingsQuery.data.settings)
    }
  }, [settingsQuery.data])

  // 保存配置
  const handleSave = (values: Record<string, any>) => {
    setSaving(true)

    // 展开嵌套的 subscriptionConfig
    const flatValues = {
      ...values,
      ...values.subscriptionConfig,
    }

    updateSettingsMutation.mutate({
      appId: currentAppId!,
      ...flatValues,
    })
  }

  // 加载中
  if (settingsQuery.isLoading) {
    return (
      <div>
        <PageHeader
          title="AI Keyboard 设置"
          breadcrumbs={[{ title: '设置' }, { title: 'AI Keyboard' }]}
        />
        <Card style={{ borderRadius: 12 }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        </Card>
      </div>
    )
  }

  // 无应用选中
  if (!currentAppId || !currentApp) {
    return (
      <div>
        <PageHeader
          title="AI Keyboard 设置"
          breadcrumbs={[{ title: '设置' }, { title: 'AI Keyboard' }]}
        />
        <Card style={{ borderRadius: 12 }}>
          <Empty description="请先选择一个应用" />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="AI Keyboard 设置"
        subtitle={`${currentApp.icon} ${currentApp.name} 的专属配置`}
        breadcrumbs={[{ title: '设置' }, { title: 'AI Keyboard' }]}
      />

      <Alert
        message="专属配置"
        description="以下配置仅对 AI Keyboard 应用生效"
        type="info"
        showIcon
        className="mb-4"
      />

      <SettingsForm
        config={aiKeyboardConfig}
        values={formValues}
        loading={settingsQuery.isLoading}
        saving={saving}
        onSave={handleSave}
        onChange={(values) => setFormValues(values)}
      />
    </div>
  )
}
