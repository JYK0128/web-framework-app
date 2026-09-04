import { TimePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormTimePickerProps = Omit<FormProps<typeof TimePicker>, 'value' | 'onChange' | 'onBlur'>;

export function FormTimePicker({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  ...props
}: FormTimePickerProps) {
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
      <TimePicker
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
