import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/stores/appStore'
import type { AppInfo } from '@/types'

const mockApp: AppInfo = {
  id: 'app-1',
  bundleId: 'com.test.app',
  name: '测试应用',
  slug: 'test-app',
  description: '',
  icon: 'https://example.com/icon.png',
  platform: 'ios',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockApp2: AppInfo = {
  id: 'app-2',
  bundleId: 'com.test.app2',
  name: '测试应用2',
  slug: 'test-app2',
  description: '',
  icon: 'https://example.com/icon2.png',
  platform: 'ios',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// 重置 store 状态
const resetStore = () => {
  useAppStore.setState({
    apps: [],
    currentAppId: null,
  })
}

describe('appStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('初始状态正确', () => {
    const { apps, currentAppId } = useAppStore.getState()
    expect(apps).toEqual([])
    expect(currentAppId).toBeNull()
  })

  it('setApps 设置应用列表并自动选中第一个', () => {
    useAppStore.getState().setApps([mockApp, mockApp2])

    const { apps, currentAppId } = useAppStore.getState()
    expect(apps).toHaveLength(2)
    expect(apps[0].name).toBe('测试应用')
    expect(currentAppId).toBe('app-1')
  })

  it('setCurrentApp 设置当前应用', () => {
    useAppStore.getState().setApps([mockApp, mockApp2])
    useAppStore.getState().setCurrentApp('app-2')

    const { currentAppId } = useAppStore.getState()
    expect(currentAppId).toBe('app-2')
  })

  it('addApp 添加应用', () => {
    useAppStore.getState().addApp(mockApp)

    const { apps } = useAppStore.getState()
    expect(apps).toHaveLength(1)
    expect(apps[0]).toEqual(mockApp)
  })

  it('updateApp 更新应用', () => {
    useAppStore.getState().addApp(mockApp)
    useAppStore.getState().updateApp('app-1', { name: '更新后的应用' })

    const { apps } = useAppStore.getState()
    expect(apps[0].name).toBe('更新后的应用')
    expect(apps[0].bundleId).toBe('com.test.app')
  })

  it('removeApp 删除应用', () => {
    useAppStore.getState().setApps([mockApp, mockApp2])
    useAppStore.getState().setCurrentApp('app-1')
    useAppStore.getState().removeApp('app-1')

    const { apps, currentAppId } = useAppStore.getState()
    expect(apps).toHaveLength(1)
    expect(apps[0].id).toBe('app-2')
    expect(currentAppId).toBe('app-2')
  })

  it('删除当前应用后自动切换到第一个', () => {
    useAppStore.getState().setApps([mockApp, mockApp2])
    useAppStore.getState().setCurrentApp('app-1')
    useAppStore.getState().removeApp('app-1')

    const { currentAppId } = useAppStore.getState()
    expect(currentAppId).toBe('app-2')
  })

  it('setApps 时保留当前选中状态', () => {
    useAppStore.getState().setApps([mockApp, mockApp2])
    useAppStore.getState().setCurrentApp('app-2')
    useAppStore.getState().setApps([mockApp, mockApp2])

    const { currentAppId } = useAppStore.getState()
    expect(currentAppId).toBe('app-2')
  })
})
