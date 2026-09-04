import { FieldLabel, RadioGroup, RadioGroupItem } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';

type FormRadioGroupProps = FormProps<typeof RadioGroup> & {
  options?: FormOption[]
};

export function FormRadioGroup({
  label,
  description,
  options = [],
  orientation = 'horizontal',
  showError,
  labelWidth,
  required,
  ...props
}: FormRadioGroupProps) {
  const field = useFieldContext<string | null>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>

      <RadioGroup
        {...props}
        name={field.name}
        aria-invalid={hasError || undefined}
        className={cn(
          'flex gap-3',
          orientation === 'vertical' && 'flex-col',
          orientation === 'horizontal' && 'flex-row flex-wrap',
          orientation === 'responsive' && `
            flex-col
            md:flex-row md:flex-wrap
          `,
        )}
        value={field.state.value}
        onValueChange={(value: string | null, eventDetails) => {
          props.onValueChange?.(value, eventDetails);
          field.handleChange(value);
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
      >
        {options.map((option) => (
          <div
            key={option.value}
            className="flex items-center gap-2"
          >
            <RadioGroupItem
              id={`${field.name}-${option.value}`}
              value={option.value}
              disabled={option.disabled}
            />
            <FieldLabel
              htmlFor={`${field.name}-${option.value}`}
              className={cn(
                'cursor-pointer',
                option.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {option.label}
            </FieldLabel>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  );
}
