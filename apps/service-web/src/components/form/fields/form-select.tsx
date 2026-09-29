import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormOption, FormProps } from '#/components/form/core/types';

type FormSelectProps = FormProps<'select'> & {
  placeholder?: string
  options?: readonly FormOption[]
};

export function FormSelect({ label, description, placeholder = '선택하세요', options = [], orientation, showError, labelWidth, required, onBlur, disabled, className, ...props }: FormSelectProps) {
  const field = useFieldContext<string | null>();

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <select
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value ?? ''}
        disabled={disabled}
        aria-invalid={field.state.meta.errors.length > 0 || undefined}
        className={cn(`
          h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1
          text-sm outline-none
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/50
        `, className)}
        onBlur={(event) => {
          onBlur?.(event);
          field.handleBlur();
        }}
        onChange={(event) => field.handleChange(event.target.value)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
    </FormField>
  );
}
