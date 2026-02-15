import { Input, InputNumber, Form } from 'antd'
import type { SettingsItem } from './types'

interface InputFieldProps extends SettingsItem {
  value?: string | number
  onChange?: (value: string | number) => void
}

export function InputField({
  key,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  tooltip,
  type,
}: InputFieldProps) {
  // 根据类型渲染不同的输入组件
  if (type === 'number') {
    return (
      <Form.Item
        key={key}
        name={key}
        label={label}
        tooltip={tooltip}
      >
        <InputNumber
          disabled={disabled}
          value={value as number}
          onChange={onChange as (value: number | null) => void}
          placeholder={placeholder}
          style={{ width: '100%' }}
        />
      </Form.Item>
    )
  }

  return (
    <Form.Item
      key={key}
      name={key}
      label={label}
      tooltip={tooltip}
    >
      <Input
        disabled={disabled}
        value={value as string}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </Form.Item>
  )
}
