import { useI18n } from '#/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';

type FormSelectProps = FormProps<typeof SelectTrigger>
  & {
    onValueChange?: React.ComponentProps<typeof Select>['onValueChange']
    placeholder?: string
    options?: readonly FormOption[]
  };

export function FormSelect({
  label,
  description,
  placeholder,
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
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('form.selectPlaceholder');
  const field = useFieldContext<string | null>();

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Select
        disabled={disabled}
        items={options}
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
          <SelectValue placeholder={displayPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
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
