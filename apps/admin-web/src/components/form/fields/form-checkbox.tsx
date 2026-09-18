import { Checkbox } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

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
        aria-invalid={hasError || undefined}
        checked={Boolean(field.state.value)}
        className={cn(hasDescription && 'mt-0.5', props.className)}
        onCheckedChange={(checked, eventDetails) => {
          props.onCheckedChange?.(checked, eventDetails);
          field.handleChange(Boolean(checked));
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
      />
    </FormField>
  );
}
