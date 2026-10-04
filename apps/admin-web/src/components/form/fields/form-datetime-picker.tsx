import { cn } from '#/.generated/shadcn/lib/utils';
import { DatetimePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormDatetimePickerProps = Omit<FormProps<typeof DatetimePicker>, 'value' | 'onChange' | 'onBlur'> & { emptyValue?: '' };

export function FormDatetimePicker({ label, description, orientation, showError, labelWidth, required, emptyValue, style, ...props }: FormDatetimePickerProps) {
  const field = useFieldContext<string | undefined>();
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <DatetimePicker
        {...props}
        id={field.name}
        style={{ ...style, ...getFieldAnchorStyle(field.name) }}
        className={cn('anchor-name-field', props.className)}
        value={field.state.value}
        onChange={(value) => {
          field.handleChange(value ?? emptyValue);
          field.handleBlur();
        }}
        onBlur={field.handleBlur}
      />
    </FormField>
  );
}
