import { DatetimePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormDatetimePickerProps = Omit<FormProps<typeof DatetimePicker>, 'value' | 'onChange' | 'onBlur'>;

export function FormDatetimePicker({ label, description, orientation, showError, labelWidth, required, ...props }: FormDatetimePickerProps) {
  const field = useFieldContext<string | undefined>();
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <DatetimePicker
        {...props}
        id={field.name}
        value={field.state.value}
        onChange={(value) => {
          field.handleChange(value);
          field.handleBlur();
        }}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}
