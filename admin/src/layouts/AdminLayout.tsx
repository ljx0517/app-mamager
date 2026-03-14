import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme, Button, Space, Divider, Spin } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CrownOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { trpc } from '@/utils/trpc'
import { PLATFORM_NAME } from '@/utils/constants'
import { getRegisteredTemplates } from '@/config/appRegistry'
import type { AppInfo } from '@/types'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ appId: string }>()
  const { user, logout } = useAuthStore()
  const { apps, setApps } = useAppStore()
  const currentAppId = params.appId
  const currentApp = apps.find((a) => a.id === currentAppId)
  const { token: themeToken } = theme.useToken()

  // 获取应用列表
  const { data: appsData, isLoading: appsLoading, error: appsError } = trpc.app.list.useQuery(undefined)

  // 处理 API 返回的数据
  useEffect(() => {
    if (appsData && Array.isArray(appsData)) {
      const appList: AppInfo[] = appsData.map((app) => ({
        id: app.id,
        name: app.name,
        slug: app.slug || '',
        description: app.description || '',
        icon: '📱',
        platform: app.platform as 'ios' | 'android' | 'web' | 'cross_platform',
        bundleId: app.bundleId,
        status: app.status as 'active' | 'inactive' | 'maintenance' | 'archived',
        createdAt: app.createdAt?.toString() || new Date().toISOString(),
        updatedAt: app.updatedAt?.toString() || new Date().toISOString(),
      }))
      setApps(appList)
    }
  }, [appsData, setApps])

  // 判断当前是否在某个 App 的管理页面
  const isInAppPage = currentAppId && apps.some((app) => app.id === currentAppId)

  // 当前 App 的详情菜单
  const appDetailMenuItems = useMemo(() => {
    if (!currentApp) return []

    const items: { key: string; icon: React.ReactNode; label: string }[] = [
      {
        key: `/${currentApp.id}/dashboard`,
        icon: <DashboardOutlined />,
        label: '仪表盘',
      },
      {
        key: `/${currentApp.id}/users`,
        icon: <UserOutlined />,
        label: '用户管理',
      },
      {
        key: `/${currentApp.id}/subscriptions`,
        icon: <CrownOutlined />,
        label: '订阅管理',
      },
      {
        key: `/${currentApp.id}/analytics`,
        icon: <BarChartOutlined />,
        label: '数据分析',
      },
    ]

    // 如果当前 App 有配置模板，添加配置模板菜单项
    if (currentApp.configTemplate) {
      const templates = getRegisteredTemplates()
      const template = templates.find((t) => t.id === currentApp.configTemplate)
      if (template) {
        items.push({
          key: `/${currentApp.id}/settings/${template.id}`,
          icon: <SettingOutlined />,
          label: template.displayName,
        })
      }
    } else {
      // 默认应用设置
      items.push({
        key: `/${currentApp.id}/settings`,
        icon: <SettingOutlined />,
        label: '应用设置',
      })
    }

    return items
  }, [currentApp])

  // App 列表菜单
  const appListMenuItems = useMemo(() => {
    return apps.map((app) => ({
      key: `/${app.id}/dashboard`,
      icon: <MobileOutlined />,
      label: app.name,
    }))
  }, [apps])

  // 平台管理菜单
  const platformMenuItems = [
    {
      key: '/apps',
      icon: <AppstoreOutlined />,
      label: '应用管理',
    },
  ]

  // 当前选中的菜单 key
  const selectedKeys = useMemo(() => {
    const path = location.pathname
    // 匹配 App 管理页面
    if (apps.some((app) => path.startsWith(`/${app.id}/`))) {
      return [path]
    }
    if (path === '/apps') {
      return ['/apps']
    }
    return []
  }, [location.pathname, apps])

  // 当前显示的菜单（App 详情菜单或 App 列表菜单）
  const currentMenuItems = isInAppPage ? appDetailMenuItems : appListMenuItems

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  /** 用户下拉菜单 */
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="min-h-screen">
      {/* ===== 侧边栏 ===== */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: themeToken.colorBgContainer,
          borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
        }}
      >
        {/* Logo 区域 */}
        <div
          className="flex items-center justify-center gap-2 cursor-pointer"
          style={{
            height: 56,
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
          onClick={() => navigate('/')}
        >
          <CloudServerOutlined
            style={{ fontSize: 22, color: themeToken.colorPrimary }}
          />
          {!collapsed && (
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: themeToken.colorText }}
            >
              {PLATFORM_NAME}
            </span>
          )}
        </div>

        {/* 加载状态 */}
        {appsLoading && (
          <div className="flex items-center justify-center py-4">
            <Spin size="small" />
          </div>
        )}

        {/* 返回 App 列表按钮（仅在 App 详情页显示） */}
        {isInAppPage && currentApp && !collapsed && (
          <div
            className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:opacity-80"
            style={{ color: themeToken.colorPrimary }}
            onClick={() => navigate('/apps')}
          >
            <span>← 返回应用列表</span>
          </div>
        )}

        {/* 当前菜单（App 详情菜单或 App 列表菜单） */}
        {!appsLoading && apps.length > 0 && (
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            items={currentMenuItems}
            onClick={handleMenuClick}
            style={{
              border: 'none',
              padding: '4px 0',
            }}
          />
        )}

        <Divider style={{ margin: '4px 16px', minWidth: 'auto', width: 'auto' }} />

        {/* 全局管理菜单 */}
        {!collapsed && (
          <div
            className="px-4 py-1 text-xs font-medium"
            style={{ color: themeToken.colorTextQuaternary, letterSpacing: 1 }}
          >
            平台管理
          </div>
        )}
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={platformMenuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            padding: '4px 0',
          }}
        />
      </Sider>

      {/* ===== 右侧主区域 ===== */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
          transition: 'margin-left 0.2s',
        }}
      >
        {/* 顶部栏 */}
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 56,
            lineHeight: '56px',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            {currentApp && (
              <span
                className="text-sm"
                style={{ color: themeToken.colorTextSecondary }}
              >
                {currentApp.icon} {currentApp.name}
              </span>
            )}
          </Space>

          <Space size="middle">
            {/* 应用管理按钮 */}
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/apps')}
            >
              应用管理
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer" size="small">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: themeToken.colorPrimary }}
                />
                <span style={{ color: themeToken.colorText }}>
                  {user?.username ?? 'Admin'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 页面内容区 */}
        <Content
          style={{
            margin: 24,
            minHeight: 'calc(100vh - 56px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
