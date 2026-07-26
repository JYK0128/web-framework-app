import { Checkbox, FieldLabel } from '#.generated/shadcn/components/ui';
import { cn } from '#.generated/shadcn/lib/utils';
import { FormField } from '#components/form/components';
import { useFieldContext } from '#components/form/context';
import type { FormProps } from '#components/form/types';

type FormCheckboxProps = FormProps<typeof Checkbox>;

export function FormCheckbox({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  ...props
}: FormCheckboxProps) {
  const field = useFieldContext<boolean | null | undefined>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <div
        className={cn(
          'flex gap-2',
          orientation === 'vertical' && 'w-fit flex-col items-center',
          orientation === 'horizontal' && 'flex-row items-center',
          orientation === 'responsive' && `
            w-fit flex-col items-center
            md:flex-row md:items-center
          `,
        )}
      >
        <Checkbox
          {...props}
          id={field.name}
          aria-invalid={hasError || undefined}
          checked={Boolean(field.state.value)}
          onCheckedChange={(checked, eventDetails) => {
            props.onCheckedChange?.(checked, eventDetails);
            field.handleChange(Boolean(checked));
          }}
          onBlur={(event) => {
            props.onBlur?.(event);
            field.handleBlur();
          }}
        />
        {label && (
          <FieldLabel
            htmlFor={field.name}
            className={cn(
              'cursor-pointer',
              props.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {label}
            {required && <sup className="text-red-600"> *</sup>}
          </FieldLabel>
        )}
      </div>
    </FormField>
  );
}
