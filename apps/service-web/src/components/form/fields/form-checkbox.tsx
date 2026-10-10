import { Checkbox } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormCheckboxProps = FormProps<typeof Checkbox>;

export function FormCheckbox({
  label,
  description,
  orientation = 'horizontal',
  showError,
  labelWidth,
  required,
  ...props
}: FormCheckboxProps) {
  const field = useFieldContext<boolean | null | undefined>();
  const hasError = field.state.meta.errors.length > 0;
  const hasDescription = Boolean(description);

  return (
    <FormField
      label={label}
      description={description}
      layout="choice"
      orientation={orientation}
      showError={showError}
      labelWidth={labelWidth}
      required={required}
    >
      <Checkbox
        {...props}
        id={field.name}
        style={{ ...props.style, ...getFieldAnchorStyle(field.name) }}
        aria-invalid={hasError || undefined}
        checked={Boolean(field.state.value)}
        className={cn('anchor-name-field', hasDescription && 'mt-0.5', props.indeterminate && `
          border-primary bg-primary text-primary-foreground
          before:h-0.5 before:w-2 before:bg-current
          [&_svg]:hidden
        `, props.className)}
        onCheckedChange={(checked, eventDetails) => {
          field.handleChange(Boolean(checked));
          props.onCheckedChange?.(checked, eventDetails);
        }}
        onBlur={(event) => {
          field.handleBlur();
          props.onBlur?.(event);
        }}
      />
    </FormField>
  );
}
