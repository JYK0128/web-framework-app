import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuthControllerVerify2FAChallenge } from '#/.generated/api/endpoints/auth/auth';
import { Alert, AlertDescription, Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type TwoFactorFormProps = {
  challengeId: string
  expiresIn?: number
};

export function TwoFactorForm({ challengeId, expiresIn = 180 }: TwoFactorFormProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [expiresAt] = useState(() => Date.now() + expiresIn * 1000);
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      return remaining;
    };

    const initial = updateCountdown();
    if (initial <= 0) return;

    const timer = setInterval(() => {
      const remaining = updateCountdown();
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const verifyMutation = useAuthControllerVerify2FAChallenge();

  const twoFaForm = useAppForm({
    defaultValues: {
      otpCode: '',
    },
    onSubmit: async ({ value }) => {
      if (isExpired) return;
      await verifyMutation.mutateAsync({
        data: { challengeId, code: value.otpCode },
      });
      await navigate({ to: '/dashboard', replace: true });
    },
  });

  return (
    <twoFaForm.AppForm>
      <FormLayout
        onSubmit={() => void twoFaForm.handleSubmit()}
        className="grid gap-4"
      >
        <twoFaForm.AppField name="otpCode">
          {(field) => (
            <field.OtpInput
              label={t('auth.twoFactorCodeLabel')}
              maxLength={6}
              disabled={isExpired}
              required
            />
          )}
        </twoFaForm.AppField>

        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3.5" />
            <span className={timeLeft < 60 ? 'text-destructive font-medium' : ''}>
              {t('auth.expiresIn', { time: formatTime(timeLeft) })}
            </span>
          </div>
        </div>

        {isExpired && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">
              {t('auth.expired')}
            </AlertDescription>
          </Alert>
        )}

        <twoFaForm.Subscribe selector={(state) => [state.isSubmitting, state.values.otpCode] as const}>
          {([isSubmitting, otpCode]) => (
            <Button
              type="submit"
              disabled={isSubmitting || isExpired || !otpCode || otpCode.length !== 6}
              className="w-full"
            >
              <span>{isSubmitting ? t('auth.verifying') : t('auth.verify')}</span>
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          )}
        </twoFaForm.Subscribe>
      </FormLayout>
    </twoFaForm.AppForm>
  );
}
