import { Checkbox, FieldLabel } from '#.generated/shadcn/components/ui';
import { cn } from '#.generated/shadcn/lib/utils';
import { FormField } from '#components/form/components';
import { useFieldContext } from '#components/form/context';
import type { FormItem, FormProps } from '#components/form/types';

type FormCheckGroupProps = FormProps<'div'> & {
  items: FormItem[]
};

export function FormCheckGroup({
  items,
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  ...props
}: FormCheckGroupProps) {
  const field = useFieldContext<string[]>();
  const hasError = field.state.meta.errors.length > 0;

  const currentValue = field.state.value ?? [];

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <div
        {...props}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
        className={cn(
          'flex gap-3',
          orientation === 'vertical' && 'flex-col',
          orientation === 'horizontal' && 'flex-row flex-wrap',
          orientation === 'responsive' && `
            flex-col
            md:flex-row md:flex-wrap
          `,
          props.className,
        )}
      >
        {items.map((item) => {
          const checked = currentValue.includes(item.value);

          return (
            <div key={item.value} className="flex items-center gap-2">
              <Checkbox
                id={`${field.name}-${item.value}`}
                checked={checked}
                aria-invalid={hasError || undefined}
                disabled={item.disabled}
                onCheckedChange={(next) => {
                  const nextChecked = Boolean(next);
                  const nextValue = nextChecked
                    ? [...currentValue, item.value]
                    : currentValue.filter((value) => value !== item.value);
                  field.handleChange(nextValue);
                }}
              />
              <FieldLabel
                htmlFor={`${field.name}-${item.value}`}
                className={cn(
                  'cursor-pointer',
                  item.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {item.label}
              </FieldLabel>
            </div>
          );
        })}
      </div>
    </FormField>
  );
}
