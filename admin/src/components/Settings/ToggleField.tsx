import { Switch, Form } from 'antd'
import type { SettingsItem } from './types'

interface ToggleFieldProps extends SettingsItem {
  value?: boolean
  onChange?: (value: boolean) => void
}

export function ToggleField({ key, label, value, onChange, disabled, tooltip }: ToggleFieldProps) {
  return (
    <Form.Item
      key={key}
      name={key}
      label={label}
      valuePropName="checked"
      tooltip={tooltip}
    >
      <Switch
        disabled={disabled}
        checked={value}
        onChange={onChange}
      />
    </Form.Item>
  )
}
