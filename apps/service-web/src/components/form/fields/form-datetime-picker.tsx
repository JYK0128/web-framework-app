import { cn } from '#/.generated/shadcn/lib/utils';
import { DatetimePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormDatetimePickerProps = FormProps<typeof DatetimePicker>;

export function FormDatetimePicker({ label, description, orientation, showError, labelWidth, required, style, onChange, onBlur, ...props }: FormDatetimePickerProps) {
  const field = useFieldContext<string>();
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <DatetimePicker
        {...props}
        id={field.name}
        style={{ ...style, ...getFieldAnchorStyle(field.name) }}
        className={cn('anchor-name-field', props.className)}
        value={field.state.value}
        onChange={(value) => {
          field.handleChange(value ?? '');
          field.handleBlur();
          onChange?.(value);
        }}
        onBlur={() => {
          field.handleBlur();
          onBlur?.();
        }}
      />
    </FormField>
  );
}
