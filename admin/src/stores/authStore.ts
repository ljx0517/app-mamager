import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  id: string
  username: string
  role: 'admin' | 'super_admin'
  avatar?: string
}

interface AuthState {
  /** 当前登录的管理员信息 */
  user: AdminUser | null
  /** JWT Token */
  token: string | null
  /** 是否已登录 */
  isAuthenticated: boolean
  /** 登录 */
  login: (user: AdminUser, token: string) => void
  /** 登出 */
  logout: () => void
  /** 更新用户信息 */
  updateUser: (user: Partial<AdminUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('admin_token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('admin_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
