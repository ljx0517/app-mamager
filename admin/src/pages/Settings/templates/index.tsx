import { useState } from 'react'
import { Row, Col, Button, Input, Space, message, Modal, Form, Tag } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import TemplateCard from './TemplateCard'
import { trpc } from '@/utils/trpc'
import type { TemplateInfo } from '@/types/template'

export default function SettingsTemplatesPage() {
  const [searchText, setSearchText] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [copyForm] = Form.useForm()

  // tRPC hooks
  const utils = trpc.useUtils()
  const templatesQuery = trpc.template.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })
  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      message.success('模板创建成功')
      setCreateModalOpen(false)
      createForm.resetFields()
      utils.template.list.invalidate()
    },
    onError: (error) => {
      message.error(error.message || '创建模板失败')
    },
  })
  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      message.success('模板更新成功')
      setEditModalOpen(false)
      editForm.resetFields()
      utils.template.list.invalidate()
    },
    onError: (error) => {
      message.error(error.message || '更新模板失败')
    },
  })
  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      message.success('模板删除成功')
      utils.template.list.invalidate()
    },
    onError: (error) => {
      message.error(error.message || '删除模板失败')
    },
  })
  const duplicateMutation = trpc.template.duplicate.useMutation({
    onSuccess: () => {
      message.success('模板复制成功')
      setCopyModalOpen(false)
      copyForm.resetFields()
      utils.template.list.invalidate()
    },
    onError: (error) => {
      message.error(error.message || '复制模板失败')
    },
  })

  // 过滤模板
  const filteredTemplates = (templatesQuery.data || []).filter((t: TemplateInfo) =>
    t.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
    t.templateId.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleRefresh = () => {
    templatesQuery.refetch()
    message.success('已刷新')
  }

  const handleEdit = (id: string) => {
    const template = templatesQuery.data?.find((t: TemplateInfo) => t.id === id)
    if (template) {
      setSelectedTemplate(template)
      editForm.setFieldsValue({
        displayName: template.displayName,
        icon: template.icon,
        description: template.description,
      })
      setEditModalOpen(true)
    }
  }

  const handleCopy = (id: string) => {
    const template = templatesQuery.data?.find((t: TemplateInfo) => t.id === id)
    if (template) {
      setSelectedTemplate(template)
      copyForm.setFieldsValue({
        newTemplateId: `${template.templateId}-copy`,
        newDisplayName: `${template.displayName} (副本)`,
      })
      setCopyModalOpen(true)
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id })
  }

  const handleCreate = () => {
    createForm.validateFields().then(values => {
      createMutation.mutate({
        templateId: values.templateId,
        displayName: values.displayName,
        icon: values.icon || '📦',
        description: values.description,
        componentPath: values.componentPath,
      })
    })
  }

  const handleUpdate = () => {
    if (!selectedTemplate) return
    editForm.validateFields().then(values => {
      updateMutation.mutate({
        id: selectedTemplate.id,
        displayName: values.displayName,
        icon: values.icon,
        description: values.description,
      })
    })
  }

  const handleDuplicate = () => {
    if (!selectedTemplate) return
    copyForm.validateFields().then(values => {
      duplicateMutation.mutate({
        id: selectedTemplate.id,
        newTemplateId: values.newTemplateId,
        newDisplayName: values.newDisplayName,
      })
    })
  }

  return (
    <div>
      <PageHeader
        title="模板管理"
        subtitle="管理应用配置模板"
        breadcrumbs={[{ title: '设置' }, { title: '模板管理' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新建模板
            </Button>
          </Space>
        }
      />

      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Input
          placeholder="搜索模板..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 320 }}
        />

        {templatesQuery.isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            {searchText ? '没有找到匹配的模板' : '暂无模板，请创建'}
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredTemplates.map((template: TemplateInfo) => (
              <Col xs={24} sm={12} lg={8} key={template.id}>
                <TemplateCard
                  template={template}
                  onEdit={handleEdit}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                />
              </Col>
            ))}
          </Row>
        )}
      </Space>

      {/* 创建模板弹窗 */}
      <Modal
        title="新建模板"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        okText="创建"
        confirmLoading={createMutation.isPending}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="templateId" label="模板 ID" rules={[{ required: true, message: '请输入模板 ID' }]}>
            <Input placeholder="例如: my-template" />
          </Form.Item>
          <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="例如: 我的模板" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="例如: 📦" maxLength={4} />
          </Form.Item>
          <Form.Item name="componentPath" label="组件路径" rules={[{ required: true, message: '请输入组件路径' }]}>
            <Input placeholder="例如: @/pages/Settings/configs/my-template" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="模板描述..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模板弹窗 */}
      <Modal
        title="编辑模板"
        open={editModalOpen}
        onOk={handleUpdate}
        onCancel={() => setEditModalOpen(false)}
        okText="保存"
        confirmLoading={updateMutation.isPending}
      >
        <Form form={editForm} layout="vertical">
          {selectedTemplate?.isBuiltin && (
            <Tag color="blue" style={{ marginBottom: 16 }}>内置模板 - 仅可编辑部分字段</Tag>
          )}
          <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="例如: 我的模板" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="例如: 📦" maxLength={4} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="模板描述..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 复制模板弹窗 */}
      <Modal
        title="复制模板"
        open={copyModalOpen}
        onOk={handleDuplicate}
        onCancel={() => setCopyModalOpen(false)}
        okText="复制"
        confirmLoading={duplicateMutation.isPending}
      >
        <Form form={copyForm} layout="vertical">
          <Form.Item name="newTemplateId" label="新模板 ID" rules={[{ required: true, message: '请输入新模板 ID' }]}>
            <Input placeholder="例如: my-template-copy" />
          </Form.Item>
          <Form.Item name="newDisplayName" label="新显示名称" rules={[{ required: true, message: '请输入新显示名称' }]}>
            <Input placeholder="例如: 我的模板 (副本)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
