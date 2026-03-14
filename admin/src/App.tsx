import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { trpc } from '@/utils/trpc'
import AdminLayout from '@/layouts/AdminLayout'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import UsersPage from '@/pages/Users'
import SubscriptionsPage from '@/pages/Subscriptions'
import AnalyticsPage from '@/pages/Analytics'
import SettingsPage from '@/pages/Settings'
import AppsPage from '@/pages/Apps'

/**
 * 路由守卫：未登录时重定向到登录页
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

/**
 * 登录页守卫：已登录时重定向到首页
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

/**
 * 首页重定向到第一个 App 的仪表盘
 * 注意：apps 数据由 AdminLayout 加载并存储在 useAppStore 中
 */
function IndexRedirect() {
  const { apps, currentAppId, setCurrentApp } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // 如果已经在某个 App 页面，不做处理
    if (location.pathname !== '/') return

    // 如果有选中的 App，跳转到其仪表盘
    if (currentAppId) {
      navigate(`/${currentAppId}/dashboard`, { replace: true })
      return
    }

    // 使用 store 中的 apps 数据（由 AdminLayout 加载）
    if (apps.length > 0) {
      const firstAppId = apps[0].id
      setCurrentApp(firstAppId)
      navigate(`/${firstAppId}/dashboard`, { replace: true })
    } else {
      // 没有 App，跳转到应用管理页面
      navigate('/apps', { replace: true })
    }
  }, [apps, currentAppId, navigate, location.pathname, setCurrentApp])

  return null
}

export default function App() {
  return (
    <Routes>
      {/* 登录页 */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* 管理后台路由 */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* 全局管理页面 */}
        <Route path="/apps" element={<AppsPage />} />

        {/* 某个 App 的业务页面 */}
        <Route path="/:appId/dashboard" element={<DashboardPage />} />
        <Route path="/:appId/users" element={<UsersPage />} />
        <Route path="/:appId/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/:appId/analytics" element={<AnalyticsPage />} />
        <Route path="/:appId/settings" element={<SettingsPage />} />
        {/* 配置模板页面 */}
        <Route path="/:appId/settings/:templateId" element={<SettingsPage />} />

        {/* 首页：重定向到第一个 App 的仪表盘 */}
        <Route path="/" element={<IndexRedirect />} />
      </Route>

      {/* 404 回退 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
