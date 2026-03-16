import { useParams } from 'react-router'
import { useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'
import SettingsContent from '@/components/Settings/SettingsContent'
import chatqConfig from './config'

/**
 * ChatQ Keyboard 设置页面
 * 根据 configName 加载对应的配置
 */
export default function ChatqSettingsPage() {
  const { appId } = useParams<{ appId: string }>()

  useEffect(() => {
    // 可以在这里根据 appId 加载特定配置
    console.log('[ChatqSettings] Loading settings for app:', appId)
  }, [appId])

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <SettingsContent
        config={chatqConfig}
        appId={appId}
      />
    </ConfigProvider>
  )
}
