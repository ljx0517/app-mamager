import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
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

        {/* 首页：提示用户选择 App */}
        <Route path="/" element={<Navigate to="/apps" replace />} />
      </Route>

      {/* 404 回退 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
