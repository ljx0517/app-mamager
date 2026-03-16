import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsForm } from '@/components/Settings/SettingsForm'
import type { SettingsConfig } from '@/components/Settings/types'

const mockConfig: SettingsConfig = {
  bundleId: 'com.test.app',
  displayName: '测试应用',
  settings: [
    {
      section: '基本设置',
      description: '配置应用基本功能',
      items: [
        {
          key: 'featureEnabled',
          label: '启用功能',
          type: 'toggle',
        },
        {
          key: 'username',
          label: '用户名',
          type: 'text',
          placeholder: '请输入用户名',
        },
      ],
    },
  ],
}

describe('SettingsForm 组件', () => {
  it('渲染配置表单', () => {
    render(<SettingsForm config={mockConfig} />)
    expect(screen.getAllByText('基本设置').length).toBeGreaterThan(0)
    expect(screen.getByText('配置应用基本功能')).toBeTruthy()
  })

  it('渲染设置项', () => {
    render(<SettingsForm config={mockConfig} />)
    expect(screen.getByText('启用功能')).toBeTruthy()
    expect(screen.getByText('用户名')).toBeTruthy()
  })

  it('渲染保存按钮', () => {
    render(<SettingsForm config={mockConfig} />)
    expect(screen.getByText('保存配置')).toBeTruthy()
  })

  it('saving=true 时显示加载状态', () => {
    render(<SettingsForm config={mockConfig} saving />)
    // Ant Button 在 loading 时会有 loading class
    const button = screen.getByText('保存配置')
    expect(button.closest('.ant-btn')?.className.includes('ant-btn-loading') ||
           button.getAttribute('class')?.includes('loading')).toBeTruthy()
  })

  it('调用 onSave 回调', async () => {
    const onSave = vi.fn()
    render(<SettingsForm config={mockConfig} onSave={onSave} />)

    const saveButton = screen.getByText('保存配置')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })

  it('多分区时使用 Tabs', () => {
    const multiSectionConfig: SettingsConfig = {
      ...mockConfig,
      settings: [
        {
          section: '基本设置',
          items: [{ key: 'test', label: '测试', type: 'text' }],
        },
        {
          section: '高级设置',
          items: [{ key: 'advanced', label: '高级', type: 'text' }],
        },
      ],
    }

    render(<SettingsForm config={multiSectionConfig} />)
    expect(screen.getAllByText('基本设置').length).toBeGreaterThan(0)
    expect(screen.getAllByText('高级设置').length).toBeGreaterThan(0)
  })
})
