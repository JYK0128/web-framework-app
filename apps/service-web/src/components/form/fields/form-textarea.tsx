import { InputGroup, InputGroupTextarea } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

type FormTextareaProps = FormProps<typeof InputGroupTextarea>;

export function FormTextarea({ label, description, orientation, showError, labelWidth, required, ...props }: FormTextareaProps) {
  const field = useFieldContext<string>();
  const hasError = field.state.meta.errors.length > 0;
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <InputGroup>
        <InputGroupTextarea
          {...props}
          id={field.name}
          name={field.name}
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
      </InputGroup>
    </FormField>
  );
}
