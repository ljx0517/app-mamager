import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme, Button, Space, Divider } from 'antd'
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
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { PLATFORM_NAME } from '@/utils/constants'
import AppSwitcher from '@/components/AppSwitcher'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const currentApp = useAppStore((s) => s.apps.find((a) => a.id === s.currentAppId))
  const { token: themeToken } = theme.useToken()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  /** 平台全局菜单 */
  const globalMenuItems = [
    {
      key: '/apps',
      icon: <AppstoreOutlined />,
      label: '应用管理',
    },
  ]

  /** 当前 App 业务菜单 */
  const appMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/subscriptions',
      icon: <CrownOutlined />,
      label: '订阅管理',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '应用设置',
    },
  ]

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

        {/* App 切换器 */}
        <AppSwitcher collapsed={collapsed} />

        <Divider style={{ margin: '4px 16px', minWidth: 'auto', width: 'auto' }} />

        {/* 当前 App 业务菜单 */}
        {currentApp && (
          <>
            {!collapsed && (
              <div
                className="px-4 py-1 text-xs font-medium"
                style={{ color: themeToken.colorTextQuaternary, letterSpacing: 1 }}
              >
                {currentApp.icon} {currentApp.name}
              </div>
            )}
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={appMenuItems}
              onClick={handleMenuClick}
              style={{
                border: 'none',
                padding: '4px 0',
              }}
            />
          </>
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
          selectedKeys={[location.pathname]}
          items={globalMenuItems}
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
