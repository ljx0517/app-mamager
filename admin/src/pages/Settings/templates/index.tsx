import { useState } from 'react'
import { Row, Col, Button, Input, Space, message, Modal, Form } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import TemplateCard from './TemplateCard'
import { getRegisteredTemplates, registerConfigTemplate } from '@/config/appRegistry'

export default function SettingsTemplatesPage() {
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 获取模板列表
  const templates = getRegisteredTemplates()

  // 过滤模板
  const filteredTemplates = templates.filter(t =>
    t.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
    t.id.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleEdit = (id: string) => {
    message.info(`编辑模板: ${id}`)
    // TODO: 跳转到编辑页面
  }

  const handleCopy = (id: string) => {
    message.success(`模板 ${id} 已复制`)
  }

  const handleDelete = (id: string) => {
    message.success(`模板 ${id} 已删除`)
    // TODO: 调用后端删除
  }

  const handleCreate = () => {
    form.validateFields().then(values => {
      registerConfigTemplate({
        id: values.id,
        displayName: values.displayName,
        icon: values.icon || '📦',
        description: values.description,
        enabled: true,
        settingsComponent: () => import('@/pages/Settings/configs/ai-keyboard'),
      })
      message.success('模板创建成功')
      setModalOpen(false)
      form.resetFields()
    })
  }

  return (
    <div>
      <PageHeader
        title="模板管理"
        subtitle="管理应用配置模板"
        breadcrumbs={[{ title: '设置' }, { title: '模板管理' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新建模板
          </Button>
        }
      />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Input
          placeholder="搜索模板..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 320 }}
        />

        <Row gutter={[16, 16]}>
          {filteredTemplates.map(template => (
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
      </Space>

      <Modal
        title="新建模板"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        okText="创建"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" label="模板 ID" rules={[{ required: true, message: '请输入模板 ID' }]}>
            <Input placeholder="例如: my-template" />
          </Form.Item>
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
    </div>
  )
}
