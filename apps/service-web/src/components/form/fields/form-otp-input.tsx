import { InputOTP, InputOTPGroup, InputOTPSlot } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormOtpInputProps = Optional<FormProps<typeof InputOTP>, 'maxLength'>;

export function FormOtpInput({ label, description, orientation, showError, labelWidth, required, maxLength = 6, disabled, ...props }: FormOtpInputProps) {
  const field = useFieldContext<string>();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <InputOTP
        {...props}
        maxLength={maxLength}
        id={field.name}
        style={{ ...props.style, ...getFieldAnchorStyle(field.name) }}
        className={cn('anchor-name-field', props.className)}
        value={field.state.value ?? ''}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-invalid={hasError || undefined}
        onBlur={(event) => {
          field.handleBlur();
          props.onBlur?.(event);
        }}
        onChange={(value) => {
          field.handleChange(value);
          props.onChange?.(value);
        }}
        onComplete={(value) => {
          field.handleBlur();
          props.onComplete?.(value);
        }}
      >
        <InputOTPGroup aria-invalid={hasError || undefined}>
          {Array.from({ length: maxLength }, (_, index) => <InputOTPSlot key={index} index={index} aria-invalid={hasError || undefined} />)}
        </InputOTPGroup>
      </InputOTP>
    </FormField>
  );
}
