import { InputGroup, InputGroupAddon, InputGroupTextarea } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormAdornmentProps, FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormTextareaProps = FormProps<typeof InputGroupTextarea> & FormAdornmentProps;

export function FormTextarea({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  leftSide,
  rightSide,
  topSide,
  bottomSide,
  ...props
}: FormTextareaProps) {
  const field = useFieldContext<string>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <InputGroup>
        {topSide && <InputGroupAddon align="block-start">{topSide}</InputGroupAddon>}
        {leftSide && <InputGroupAddon align="inline-start">{leftSide}</InputGroupAddon>}
        <InputGroupTextarea
          {...props}
          id={field.name}
          style={{ ...props.style, ...getFieldAnchorStyle(field.name) }}
          className={cn(`
            anchor-name-field
            disabled:pointer-events-none
          `, props.className)}
          value={field.state.value ?? ''}
          aria-invalid={hasError || undefined}
          onBlur={(event) => {
            field.handleBlur();
            props.onBlur?.(event);
          }}
          onChange={(event) => {
            field.handleChange(event.target.value);
            props.onChange?.(event);
          }}
        />
        {rightSide && <InputGroupAddon align="inline-end">{rightSide}</InputGroupAddon>}
        {bottomSide && <InputGroupAddon align="block-end">{bottomSide}</InputGroupAddon>}
      </InputGroup>
    </FormField>
  );
}
