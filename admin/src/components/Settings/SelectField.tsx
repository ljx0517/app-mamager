import { Select, Form } from 'antd'
import type { SettingsItem } from './types'

interface SelectFieldProps extends SettingsItem {
  value?: string | number
  onChange?: (value: string | number) => void
}

export function SelectField({
  key,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  tooltip,
  options = [],
}: SelectFieldProps) {
  return (
    <Form.Item
      key={key}
      name={key}
      label={label}
      tooltip={tooltip}
    >
      <Select
        disabled={disabled}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        options={options}
      />
    </Form.Item>
  )
}
