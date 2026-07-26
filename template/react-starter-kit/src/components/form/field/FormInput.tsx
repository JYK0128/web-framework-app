import { Input, InputGroup, InputGroupAddon, InputGroupInput } from '#.generated/shadcn/components/ui';
import { FormField } from '#components/form/components';
import { useFieldContext } from '#components/form/context';
import type { FormProps } from '#components/form/types';

type FormInputProps = FormProps<typeof Input> & {
  leftSide?: React.ReactNode
  rightSide?: React.ReactNode
  topSide?: React.ReactNode
  bottomSide?: React.ReactNode
};

export function FormInput({
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
}: FormInputProps) {
  const field = useFieldContext<string | number | readonly string[]>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      {(leftSide || rightSide || topSide || bottomSide)
        ? (
          <InputGroup>
            {topSide && <InputGroupAddon align="block-start">{topSide}</InputGroupAddon>}
            {leftSide && <InputGroupAddon align="inline-start">{leftSide}</InputGroupAddon>}
            <InputGroupInput
              {...props}
              id={field.name}
              name={field.name}
              value={field.state.value}
              aria-invalid={hasError || undefined}
              onBlur={(event) => {
                props.onBlur?.(event);
                field.handleBlur();
              }}
              onChange={(event) => {
                props.onChange?.(event);
                field.handleChange(
                  props.type === 'number'
                    ? event.target.valueAsNumber
                    : event.target.value,
                );
              }}
            />
            {rightSide && <InputGroupAddon align="inline-end">{rightSide}</InputGroupAddon>}
            {bottomSide && <InputGroupAddon align="block-end">{bottomSide}</InputGroupAddon>}
          </InputGroup>
        )
        : (
          <Input
            {...props}
            id={field.name}
            name={field.name}
            value={field.state.value}
            aria-invalid={hasError || undefined}
            onBlur={(event) => {
              props.onBlur?.(event);
              field.handleBlur();
            }}
            onChange={(event) => {
              props.onChange?.(event);
              field.handleChange(props.type === 'number' ? event.target.valueAsNumber : event.target.value);
            }}
          />
        )}
    </FormField>
  );
}
