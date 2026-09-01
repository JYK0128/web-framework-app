import { Switch } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/context';
import type { FormProps } from '#/components/form/types';

type FormSwitchProps = FormProps<typeof Switch>;

export function FormSwitch({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  ...props
}: FormSwitchProps) {
  const field = useFieldContext<boolean>();
  const hasError = field.state.meta.errors.length > 0;
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Switch
        {...props}
        id={field.name}
        name={field.name}
        checked={field.state.value}
        aria-invalid={hasError || undefined}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
        onCheckedChange={(checked, eventDetails) => {
          props.onCheckedChange?.(checked, eventDetails);
          field.handleChange(checked);
        }}
      />
    </FormField>
  );
}
