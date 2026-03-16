import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

// 重置 store 状态
const resetStore = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  })
}

describe('authStore', () => {
  beforeEach(() => {
    resetStore()
    localStorage.clear()
  })

  it('初始状态正确', () => {
    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('login 方法设置用户和 token', () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      role: 'admin' as const,
    }
    const mockToken = 'test-token'

    useAuthStore.getState().login(mockUser, mockToken)

    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
    expect(token).toBe(mockToken)
    expect(isAuthenticated).toBe(true)
  })

  it('login 时设置 localStorage', () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      role: 'admin' as const,
    }

    useAuthStore.getState().login(mockUser, 'test-token')

    expect(localStorage.getItem('admin_token')).toBe('test-token')
  })

  it('logout 方法清除用户和 token', () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      role: 'admin' as const,
    }

    useAuthStore.getState().login(mockUser, 'test-token')
    useAuthStore.getState().logout()

    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('logout 时清除 localStorage', () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      role: 'admin' as const,
    }

    useAuthStore.getState().login(mockUser, 'test-token')
    useAuthStore.getState().logout()

    expect(localStorage.getItem('admin_token')).toBeNull()
  })

  it('updateUser 方法更新用户信息', () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      role: 'admin' as const,
    }

    useAuthStore.getState().login(mockUser, 'test-token')
    useAuthStore.getState().updateUser({ username: 'new-admin', avatar: 'avatar.png' })

    const { user } = useAuthStore.getState()
    expect(user?.username).toBe('new-admin')
    expect(user?.avatar).toBe('avatar.png')
    expect(user?.id).toBe('1') // 保持不变
  })

  it('updateUser 在未登录时不起作用', () => {
    useAuthStore.getState().updateUser({ username: 'test' })

    const { user } = useAuthStore.getState()
    expect(user).toBeNull()
  })
})
