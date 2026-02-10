import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppInfo } from '@/types'

/**
 * 模拟 App 数据
 * 接入 tRPC 后从服务端获取
 */
export const MOCK_APPS: AppInfo[] = [
  {
    id: 'app_001',
    name: 'AI Keyboard',
    slug: 'ai-keyboard',
    description: '智能 AI 键盘，用 AI 帮你回复消息',
    icon: '⌨️',
    platform: 'ios',
    bundleId: 'com.jaxon.aikeyboard',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'app_002',
    name: 'AI Translator',
    slug: 'ai-translator',
    description: '实时 AI 翻译助手，支持多语言互译',
    icon: '🌐',
    platform: 'cross_platform',
    bundleId: 'com.jaxon.aitranslator',
    status: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-08T00:00:00Z',
  },
  {
    id: 'app_003',
    name: 'AI Writer',
    slug: 'ai-writer',
    description: '智能写作助手，一键生成高质量文案',
    icon: '✍️',
    platform: 'ios',
    bundleId: 'com.jaxon.aiwriter',
    status: 'maintenance',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-09T00:00:00Z',
  },
]

interface AppState {
  /** 所有 App 列表 */
  apps: AppInfo[]
  /** 当前选中的 App ID */
  currentAppId: string | null
  /** 获取当前 App 信息 */
  currentApp: AppInfo | null
  /** 设置当前 App */
  setCurrentApp: (appId: string) => void
  /** 设置 App 列表 */
  setApps: (apps: AppInfo[]) => void
  /** 新增 App */
  addApp: (app: AppInfo) => void
  /** 更新 App */
  updateApp: (id: string, partial: Partial<AppInfo>) => void
  /** 删除 App */
  removeApp: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apps: MOCK_APPS,
      currentAppId: MOCK_APPS[0]?.id ?? null,

      get currentApp() {
        const state = get()
        return state.apps.find((app) => app.id === state.currentAppId) ?? null
      },

      setCurrentApp: (appId) => set({ currentAppId: appId }),

      setApps: (apps) => set({ apps }),

      addApp: (app) =>
        set((state) => ({ apps: [...state.apps, app] })),

      updateApp: (id, partial) =>
        set((state) => ({
          apps: state.apps.map((app) =>
            app.id === id ? { ...app, ...partial, updatedAt: new Date().toISOString() } : app,
          ),
        })),

      removeApp: (id) =>
        set((state) => ({
          apps: state.apps.filter((app) => app.id !== id),
          // 若删除的是当前选中的 App，自动切换到第一个
          currentAppId:
            state.currentAppId === id
              ? state.apps.find((app) => app.id !== id)?.id ?? null
              : state.currentAppId,
        })),
    }),
    {
      name: 'admin-app',
      partialize: (state) => ({
        currentAppId: state.currentAppId,
      }),
    },
  ),
)
