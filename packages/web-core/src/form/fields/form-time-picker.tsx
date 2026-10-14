import { TimePicker } from '@pkg/web-core/date-picker';
import { FormField } from '@pkg/web-core/form/components';
import { useFieldContext } from '@pkg/web-core/form/core/context';
import type { FormProps } from '@pkg/web-core/form/core/types';
import { cn } from '@pkg/web-core/utils';

import { getFieldAnchorStyle } from './field-anchor';

type FormTimePickerProps = FormProps<typeof TimePicker>;

export function FormTimePicker({ label, description, orientation, showError, labelWidth, required, style, onChange, onBlur, ...props }: FormTimePickerProps) {
  const field = useFieldContext<string | undefined>();
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <TimePicker
        {...props}
        id={field.name}
        style={{ ...style, ...getFieldAnchorStyle(field.name) }}
        className={cn('anchor-name-field', props.className)}
        value={field.state.value}
        onChange={(value) => {
          field.handleChange(value);
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
