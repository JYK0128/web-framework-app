import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';

type FormSelectProps = FormProps<typeof SelectTrigger> & {
  onValueChange?: React.ComponentProps<typeof Select>['onValueChange']
  placeholder?: string
  options?: readonly FormOption[]
};

export function FormSelect({
  label,
  description,
  placeholder = '선택하세요',
  options = [],
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

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Select
        items={options}
        value={field.state.value}
        disabled={disabled}
        onValueChange={(value, eventDetails) => {
          onValueChange?.(value, eventDetails);
          field.handleChange(value);
        }}
      >
        <SelectTrigger
          {...triggerProps}
          id={field.name}
          className={cn('w-full', triggerProps.className)}
          disabled={disabled}
          aria-invalid={field.state.meta.errors.length > 0 || undefined}
          onBlur={(event) => {
            onBlur?.(event);
            field.handleBlur();
          }}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
