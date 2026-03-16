import { Card, Button, Space, Popconfirm, Typography, Tag } from 'antd'
import { EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TemplateInfo } from '@/types/template'

const { Text } = Typography

interface TemplateCardProps {
  template: TemplateInfo
  onEdit: (id: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
}

export default function TemplateCard({ template, onEdit, onCopy, onDelete }: TemplateCardProps) {
  return (
    <Card
      hoverable
      style={{ borderRadius: 12 }}
      actions={[
        <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(template.id)} size="small">
          编辑
        </Button>,
        <Button type="text" icon={<CopyOutlined />} onClick={() => onCopy(template.id)} size="small">
          复制
        </Button>,
        template.isBuiltin ? (
          <Button type="text" disabled size="small">
            删除
          </Button>
        ) : (
          <Popconfirm
            title="确定删除此模板？"
            description="删除后无法恢复"
            onConfirm={() => onDelete(template.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        ),
      ]}
    >
      <Card.Meta
        avatar={<span style={{ fontSize: 32 }}>{template.icon}</span>}
        title={
          <Space>
            <Text strong>{template.displayName}</Text>
            {template.isBuiltin && <Tag color="blue">内置</Tag>}
          </Space>
        }
        description={
          <div>
            <Text type="secondary">{template.description || '暂无描述'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {template.templateId}
            </Text>
          </div>
        }
      />
    </Card>
  )
}
