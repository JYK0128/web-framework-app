import { Input } from '#/.generated/shadcn/components/ui';

export function DatePicker({ value, onChange, placeholder, ...props }: { value?: string, onChange?: (value: string | undefined) => void, placeholder?: string } & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  return <Input {...props} type="date" value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange?.(event.target.value || undefined)} />;
}
