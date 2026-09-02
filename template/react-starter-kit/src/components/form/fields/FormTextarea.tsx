import { InputGroup, InputGroupAddon, InputGroupTextarea } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormTextareaProps = FormProps<typeof InputGroupTextarea> & {
  leftSide?: React.ReactNode;
  rightSide?: React.ReactNode;
  topSide?: React.ReactNode;
  bottomSide?: React.ReactNode;
};

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
          name={field.name}
          className={cn('disabled:pointer-events-none', props.className)}
          value={field.state.value ?? ''}
          aria-invalid={hasError || undefined}
          onBlur={(event) => {
            props.onBlur?.(event);
            field.handleBlur();
          }}
          onChange={(event) => {
            props.onChange?.(event);
            field.handleChange(event.target.value);
          }}
        />
        {rightSide && <InputGroupAddon align="inline-end">{rightSide}</InputGroupAddon>}
        {bottomSide && <InputGroupAddon align="block-end">{bottomSide}</InputGroupAddon>}
      </InputGroup>
    </FormField>
  );
}
