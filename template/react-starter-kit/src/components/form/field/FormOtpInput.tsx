import { InputOTP, InputOTPGroup, InputOTPSlot } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/context';
import type { FormProps } from '#/components/form/types';

type FormOtpInputProps = Omit<FormProps<typeof InputOTP>, 'maxLength' | 'children'> & {
  maxLength?: React.ComponentProps<typeof InputOTP>['maxLength']
};

export function FormOtpInput({ label, description, orientation, showError, labelWidth, required, maxLength = 6, disabled }: FormOtpInputProps) {
  const field = useFieldContext<string>();
  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <InputOTP maxLength={maxLength} value={field.state.value ?? ''} disabled={disabled} aria-invalid={field.state.meta.errors.length > 0 || undefined} onChange={(value) => field.handleChange(value)} onComplete={() => field.handleBlur()}><InputOTPGroup>{Array.from({ length: maxLength }, (_, index) => <InputOTPSlot key={index} index={index} aria-invalid={field.state.meta.errors.length > 0 || undefined} />)}</InputOTPGroup></InputOTP>
    </FormField>
  );
}
