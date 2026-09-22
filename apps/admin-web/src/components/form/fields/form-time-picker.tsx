import { TimePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormTimePickerProps = Omit<FormProps<typeof TimePicker>, 'value' | 'onChange' | 'onBlur'>;

export function FormTimePicker({ label, description, orientation, showError, labelWidth, required, ...props }: FormTimePickerProps) {
  const field = useFieldContext<string | undefined>();
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <TimePicker
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
