import { cn } from '#/.generated/shadcn/lib/utils';
import { TimePicker } from '#/components/date-picker';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

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
