import { m } from '#.generated/paraglide/messages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#.generated/shadcn/components/ui';
import { FormField } from '#components/form/components';
import { useFieldContext } from '#components/form/context';
import type { FormItem, FormProps } from '#components/form/types';

type FormSelectProps = FormProps<typeof SelectTrigger>
  & {
    onValueChange?: React.ComponentProps<typeof Select>['onValueChange']
    placeholder?: string
    items: FormItem[]
  };

export function FormSelect({
  label,
  description,
  placeholder = m.select_placeholder(),
  items,
  orientation,
  showError,
  labelWidth,
  required,
  onBlur,
  onValueChange,
  disabled,
  ...triggerProps
}: FormSelectProps) {
  const field = useFieldContext<string | null>();
  const selectedItem = items.find((item) => item.value === field.state.value);

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Select
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value, eventDetails) => {
          onValueChange?.(value, eventDetails);
          field.handleChange(value);
        }}
      >
        <SelectTrigger
          {...triggerProps}
          id={field.name}
          disabled={disabled}
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          onBlur={(event) => {
            onBlur?.(event);
            field.handleBlur();
          }}
        >
          <SelectValue placeholder={placeholder}>{selectedItem?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
