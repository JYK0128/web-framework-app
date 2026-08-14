import { useI18n } from '@pkg/shared/web';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { useAuthControllerVerify2FAChallenge } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

type TwoFactorLocationState = {
  challengeId?: string
};

export function TwoFactorForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const challengeId = (location.state as TwoFactorLocationState).challengeId;

  const verifyMutation = useAuthControllerVerify2FAChallenge({
    mutation: {
      onSuccess: async () => {
        await navigate({ to: '/onboarding', replace: true });
      },
    },
  });

  const twoFaForm = useAppForm({
    defaultValues: {
      otpCode: '',
    },
    onSubmit: async ({ value }) => {
      if (!challengeId) throw new Error('The MFA challenge ID is missing');

      await verifyMutation.mutateAsync({
        data: { challengeId, code: value.otpCode },
      });
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
              label={t('auth.twoFactorCodeLabel')}
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
              <span>{isSubmitting ? t('auth.verifying') : t('auth.verify')}</span>
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          )}
        </twoFaForm.Subscribe>
      </form>
    </twoFaForm.AppForm>
  );
}
