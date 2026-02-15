import { Card } from 'antd'
import type { SettingsItem } from './types'

interface CustomFieldProps extends SettingsItem {
  onChange?: (value: any) => void
}

export function CustomField({ key, label, component: Component, ...rest }: CustomFieldProps) {
  if (!Component) {
    return null
  }

  return (
    <Card key={key} size="small" className="mb-4">
      {label && <Card.Meta title={label} />}
      <div className="mt-4">
        <Component {...rest} />
      </div>
    </Card>
  )
}
