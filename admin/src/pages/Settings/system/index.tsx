import { useState } from 'react'
import { Tabs, message } from 'antd'
import PageHeader from '@/components/PageHeader'
import AIConfig from './AIConfig'
import PaymentConfig from './PaymentConfig'

export default function SettingsSystemPage() {
  const [activeTab, setActiveTab] = useState('ai')

  const handleSave = async (values: unknown) => {
    console.log('保存配置:', values)
    message.success('配置已保存')
    // TODO: 调用后端保存
  }

  const tabItems = [
    {
      key: 'ai',
      label: 'AI 配置',
      children: <AIConfig onSave={handleSave} />,
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

  return (
    <div>
      <PageHeader
        title="系统配置"
        subtitle="全局系统参数配置"
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
