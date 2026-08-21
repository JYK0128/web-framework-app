import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, Clock, Loader2, LogOut, MessageSquareText, Phone, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { getAuthControllerUserProfileQueryKey, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerIssuePhoneChallenge, useOnboardingControllerVerifyPhone } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useCountdown } from '#/hooks';

interface PhoneChallenge {
  challengeId: string
  mockCode: string
}

export const Route = createFileRoute('/_protected/onboarding/phone')({
  component: PhoneOnboardingPage,
});

function PhoneOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const countdown = useCountdown();
  const resendCountdown = useCountdown();
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);

  const challengeMutation = useOnboardingControllerIssuePhoneChallenge();
  const verifyMutation = useOnboardingControllerVerifyPhone();
  const logoutMutation = useAuthControllerLogout();

  const form = useAppForm({
    defaultValues: {
      phoneNumber: '',
      code: '',
    },
    onSubmit: async ({ value }) => {
      if (!challenge || !/^\d{6}$/.test(value.code) || countdown.isExpired) return;

      try {
        await verifyMutation.mutateAsync({ data: { challengeId: challenge.challengeId, code: value.code } });
        toast.success(t('onboarding.phoneVerifySuccess'));
        await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        await navigate({ to: '/dashboard', replace: true });
      }
      catch {
        toast.error(t('onboarding.phoneVerifyFailed'));
      }
    },
  });

  const handleIssueChallenge = async () => {
    const phoneNumber = form.state.values.phoneNumber.replace(/[^\d]/g, '');
    if (!/^010\d{8}$/.test(phoneNumber)) {
      toast.error(t('onboarding.phoneInvalid'));
      return;
    }

    try {
      form.setFieldValue('phoneNumber', phoneNumber);
      const result = await challengeMutation.mutateAsync({ data: { phoneNumber } });
      setChallenge({ challengeId: result.challengeId, mockCode: result.mockCode });
      form.setFieldValue('code', '');
      countdown.start(result.expiresIn);
      resendCountdown.start(60);
      toast.success(t('onboarding.phoneChallengeIssued'));
    }
    catch {
      toast.error(t('onboarding.phoneChallengeFailed'));
    }
  };

  const handleChangePhone = () => {
    setChallenge(null);
    countdown.reset();
    resendCountdown.reset();
    form.setFieldValue('code', '');
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // Continue with local cleanup even if server cleanup fails.
    }
    finally {
      queryClient.removeQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
    }
  };

  return (
    <div className="
      flex min-h-dvh flex-col items-center justify-center bg-linear-to-b
      from-background via-muted/30 to-background p-4
      sm:p-6
    "
    >
      <div className="grid w-full max-w-md gap-6">
        <div className="grid justify-items-center gap-2 text-center">
          <div className="
            flex items-center gap-2 rounded-full border border-primary/20
            bg-primary/10 px-3 py-1 text-xs font-semibold text-primary
          "
          >
            <span className="size-2 rounded-full bg-primary" />
            {t('onboarding.stepIndicator', { current: '3', total: '3' })}
            <span className="text-muted-foreground">·</span>
            <span>{t('onboarding.stepPhone')}</span>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="size-full rounded-full bg-primary" />
          </div>
        </div>

        <Card className="
          border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl
        "
        >
          <CardHeader className="pb-4 text-center">
            <div className="
              mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl
              border border-primary/20 bg-linear-to-br from-primary/20
              to-primary/5 text-primary shadow-xs
            "
            >
              <Phone className="size-7" />
            </div>
            <CardTitle className="
              text-xl font-extrabold tracking-tight
              sm:text-2xl
            "
            >
              {t('onboarding.phoneTitle')}
            </CardTitle>
            <CardDescription className="
              mx-auto mt-1.5 max-w-xs text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {t('onboarding.phoneSubtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-4">
            <form.AppForm>
              <FormLayout
                onSubmit={() => void form.handleSubmit()}
                className="grid gap-5"
              >
                <form.AppField name="phoneNumber">
                  {(field) => (
                    <field.Input
                      type="tel"
                      label={t('onboarding.phoneLabel')}
                      placeholder="01012345678"
                      autoComplete="tel"
                      required
                      disabled={challenge !== null || challengeMutation.isPending}
                      description={t('onboarding.phoneHint')}
                      leftSide={(
                        <Phone className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    />
                  )}
                </form.AppField>

                {!challenge
                  ? (
                    <Button
                      type="button"
                      size="lg"
                      className="h-11 w-full gap-2 font-bold"
                      disabled={challengeMutation.isPending}
                      onClick={() => void handleIssueChallenge()}
                    >
                      {challengeMutation.isPending
                        ? <Loader2 className="size-4 animate-spin" />
                        : <MessageSquareText className="size-4" />}
                      {challengeMutation.isPending
                        ? t('onboarding.phoneChallengeIssuing')
                        : t('onboarding.phoneChallengeButton')}
                      {!challengeMutation.isPending && (
                        <ArrowRight className="size-4" />
                      )}
                    </Button>
                  )
                  : (
                    <div className="grid gap-4">
                      <div className="
                        grid gap-2 rounded-lg border border-primary/20
                        bg-primary/5 p-3
                      "
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="
                            flex items-center gap-2 text-xs font-semibold
                            text-foreground
                          "
                          >
                            <CheckCircle2 className="
                              size-4 shrink-0 text-primary
                            "
                            />
                            {t('onboarding.phoneChallengeIssued')}
                          </div>
                          <Badge
                            variant="secondary"
                            className="font-mono text-[11px]"
                          >
                            <Clock className="mr-1 size-3" />
                            {countdown.formattedTime}
                          </Badge>
                        </div>
                        <div className="
                          flex items-center justify-between gap-3 text-xs
                          text-muted-foreground
                        "
                        >
                          <span>{t('onboarding.phoneMockCode')}</span>
                          <code className="
                            font-mono text-base font-bold tracking-widest
                            text-foreground
                          "
                          >
                            {challenge.mockCode}
                          </code>
                        </div>
                      </div>

                      <form.AppField name="code">
                        {(field) => (
                          <field.OtpInput
                            label={t('onboarding.phoneOtpLabel')}
                            maxLength={6}
                            required
                            disabled={verifyMutation.isPending || countdown.isExpired}
                          />
                        )}
                      </form.AppField>

                      <form.Subscribe selector={(state) => state.values.code}>
                        {(code) => (
                          <Button
                            type="submit"
                            size="lg"
                            className="h-11 w-full gap-2 font-bold"
                            disabled={verifyMutation.isPending || countdown.isExpired || code.length !== 6}
                          >
                            {verifyMutation.isPending
                              ? <Loader2 className="size-4 animate-spin" />
                              : <CheckCircle2 className="size-4" />}
                            {verifyMutation.isPending
                              ? t('onboarding.verifying')
                              : t('onboarding.phoneVerifyButton')}
                          </Button>
                        )}
                      </form.Subscribe>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={challengeMutation.isPending || resendCountdown.isRunning}
                          onClick={() => void handleIssueChallenge()}
                        >
                          <RefreshCw className="size-3.5" />
                          {t('onboarding.resendCode')}
                          {resendCountdown.isRunning && ` (${resendCountdown.timeLeft}s)`}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={challengeMutation.isPending || verifyMutation.isPending}
                          onClick={handleChangePhone}
                        >
                          {t('onboarding.phoneChange')}
                        </Button>
                      </div>
                    </div>
                  )}
              </FormLayout>
            </form.AppForm>
          </CardContent>

          <CardFooter className="
            flex justify-center border-t border-border/60 py-3.5
          "
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              disabled={logoutMutation.isPending}
              onClick={() => void handleLogout()}
            >
              {logoutMutation.isPending
                ? (
                  <Loader2 className="size-3.5 animate-spin" />
                )
                : (
                  <LogOut className="size-3.5" />
                )}
              {t('onboarding.logoutPrompt')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
