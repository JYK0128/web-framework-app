import { DatePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormDatePickerProps = Omit<FormProps<typeof DatePicker>, 'value' | 'onChange' | 'onBlur'>;

export function FormDatePicker({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  ...props
}: FormDatePickerProps) {
  const field = useFieldContext<string | undefined>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField
      label={label}
      description={description}
      orientation={orientation}
      showError={showError}
      labelWidth={labelWidth}
      required={required}
    >
      <DatePicker
        {...props}
        id={field.name}
        value={field.state.value}
        aria-invalid={hasError || undefined}
        onChange={(val) => {
          field.handleChange(val);
          field.handleBlur();
        }}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}
