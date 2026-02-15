import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppInfo } from '@/types'

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
      apps: [],
      currentAppId: null,

      get currentApp() {
        const state = get()
        return state.apps.find((app) => app.id === state.currentAppId) ?? null
      },

      setCurrentApp: (appId) => set({ currentAppId: appId }),

      setApps: (apps) => set((state) => ({
        apps,
        // 如果当前选中的 App 不在列表中，自动切换到第一个
        currentAppId: state.currentAppId && apps.some(a => a.id === state.currentAppId)
          ? state.currentAppId
          : apps[0]?.id ?? null
      })),

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
