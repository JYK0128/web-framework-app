import { ArrowRight } from 'lucide-react';

import { Button } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { useAuth } from '#/core/auth/useAuth';

export function TwoFactorForm() {
  const { verify2FA } = useAuth();

  const twoFaForm = useAppForm({
    defaultValues: {
      otpCode: '',
    },
    onSubmit: async ({ value }) => {
      await verify2FA(value.otpCode);
    },
  });

  return (
    <twoFaForm.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void twoFaForm.handleSubmit();
        }}
        className="grid gap-4"
      >
        <twoFaForm.AppField name="otpCode">
          {(field) => (
            <field.OtpInput
              label="2FA 보안 인증 코드"
              maxLength={6}
              required
            />
          )}
        </twoFaForm.AppField>

        <twoFaForm.Subscribe selector={(state) => [state.isSubmitting, state.values.otpCode] as const}>
          {([isSubmitting, otpCode]) => (
            <Button
              type="submit"
              disabled={isSubmitting || !otpCode || otpCode.length !== 6}
              className="w-full"
            >
              <span>{isSubmitting ? '인증 중...' : '보안 인증 확인'}</span>
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          )}
        </twoFaForm.Subscribe>
      </form>
    </twoFaForm.AppForm>
  );
}
