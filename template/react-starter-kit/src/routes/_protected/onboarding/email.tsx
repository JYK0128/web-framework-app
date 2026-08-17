import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Info, Loader2, LogOut, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerIssueEmailVerification, useOnboardingControllerVerifyEmail } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, InputOTP, InputOTPGroup, InputOTPSlot } from '#/.generated/shadcn/components/ui';
import { useCountdown } from '#/hooks';

export const Route = createFileRoute('/_protected/onboarding/email')({
  component: EmailOnboardingPage,
});

function EmailOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { user } = Route.useRouteContext();

  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const countdown = useCountdown();

  const issueEmailVerificationMutation = useOnboardingControllerIssueEmailVerification();
  const verifyEmailMutation = useOnboardingControllerVerifyEmail();
  const logoutMutation = useAuthControllerLogout();

  const isSending = issueEmailVerificationMutation.isPending;
  const isVerifying = verifyEmailMutation.isPending;
  const isLoggingOut = logoutMutation.isPending;

  const handleSendCode = async () => {
    const data = await issueEmailVerificationMutation.mutateAsync();
    setIsCodeSent(true);
    countdown.start(data?.expiresIn || 300);
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    await verifyEmailMutation.mutateAsync({ data: { code } });
    await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
    void navigate({ to: '/dashboard', replace: true });
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // Proceed with client cleanup regardless
    }
    finally {
      queryClient.removeQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
    }
  };

  const isExpired = isCodeSent && countdown.isExpired;

  return (
    <div className="
      flex min-h-dvh flex-col items-center justify-center bg-linear-to-b
      from-background via-muted/30 to-background p-4
      sm:p-6
    "
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Onboarding Header & Step Indicator */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="
            inline-flex items-center gap-2 rounded-full border border-primary/20
            bg-primary/10 px-3 py-1 text-xs font-semibold text-primary
          "
          >
            <span className="flex size-2 rounded-full bg-primary animate-pulse" />
            {t('onboarding.stepIndicator', { current: '1', total: '2' })}
            <span className="text-muted-foreground">·</span>
            <span>{t('onboarding.stepEmail')}</span>
          </div>

          {/* Progress bar (50%) */}
          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="
              h-full w-1/2 rounded-full bg-primary transition-all duration-500
            "
            />
          </div>
        </div>

        {/* Main Card */}
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
              {user.emailVerified
                ? (
                  <CheckCircle2 className="size-7" />
                )
                : (
                  <Mail className="size-7" />
                )}
            </div>

            <CardTitle className="
              text-xl font-extrabold tracking-tight
              sm:text-2xl
            "
            >
              {t('onboarding.emailTitle')}
            </CardTitle>

            <CardDescription className="
              mx-auto mt-1.5 max-w-xs text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {t('onboarding.emailSubtitle')}
            </CardDescription>

            {/* Email Address Pill */}
            <div className="mt-3 flex items-center justify-center">
              <div className="
                inline-flex items-center gap-1.5 rounded-lg border border-border
                bg-muted/60 px-3 py-1.5 font-mono text-xs font-medium
                text-foreground shadow-2xs
              "
              >
                <Mail className="size-3.5 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 px-6 py-4">
            {!isCodeSent
              ? (
                <div className="grid gap-4">
                  <div className="
                    flex items-start gap-2.5 rounded-lg border border-primary/20
                    bg-primary/5 p-3.5 text-xs/relaxed text-muted-foreground
                  "
                  >
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {t('onboarding.emailDescription', { email: user.email })}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t('onboarding.emailHint')}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    className="
                      h-11 w-full gap-2 text-sm font-bold shadow-md
                      transition-all
                    "
                    disabled={isSending}
                    onClick={() => void handleSendCode()}
                  >
                    {isSending
                      ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t('onboarding.sendingCode')}
                        </>
                      )
                      : (
                        <>
                          <Sparkles className="size-4" />
                          {t('onboarding.sendCode')}
                          <ArrowRight className="ml-0.5 size-4" />
                        </>
                      )}
                  </Button>
                </div>
              )
              : (
                <div className="grid gap-5">
                  <div className="grid justify-items-center gap-3">
                    <div className="
                      flex items-center justify-between w-full px-1
                    "
                    >
                      <label className="
                        text-xs font-bold uppercase tracking-wider
                        text-muted-foreground
                      "
                      >
                        {t('onboarding.otpLabel')}
                      </label>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[11px] font-semibold"
                      >
                        {isExpired
                          ? (
                            <span className="
                              flex items-center gap-1 text-destructive
                            "
                            >
                              <AlertCircle className="size-3" />
                              {t('onboarding.expired')}
                            </span>
                          )
                          : (
                            <span className="
                              flex items-center gap-1 text-primary
                            "
                            >
                              <Clock className="size-3" />
                              {t('onboarding.expiresIn', { time: countdown.formattedTime })}
                            </span>
                          )}
                      </Badge>
                    </div>

                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={code}
                      onChange={(val) => setCode(val)}
                      disabled={isVerifying || isExpired}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot
                          index={0}
                          className="
                            size-11 rounded-lg text-base font-bold shadow-xs
                            sm:size-12
                          "
                        />
                        <InputOTPSlot
                          index={1}
                          className="
                            size-11 rounded-lg text-base font-bold shadow-xs
                            sm:size-12
                          "
                        />
                        <InputOTPSlot
                          index={2}
                          className="
                            size-11 rounded-lg text-base font-bold shadow-xs
                            sm:size-12
                          "
                        />
                        <InputOTPSlot
                          index={3}
                          className="
                            size-11 rounded-lg text-base font-bold shadow-xs
                            sm:size-12
                          "
                        />
                        <InputOTPSlot
                          index={4}
                          className="
                            size-11 rounded-lg text-base font-bold shadow-xs
                            sm:size-12
                          "
                        />
                        <InputOTPSlot
                          index={5}
                          className="
                            size-11 rounded-lg text-base font-bold shadow-xs
                            sm:size-12
                          "
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="grid gap-2.5">
                    <Button
                      type="button"
                      size="lg"
                      className="h-11 w-full gap-2 text-sm font-bold shadow-md"
                      disabled={code.length !== 6 || isVerifying || isExpired}
                      onClick={() => void handleVerify()}
                    >
                      {isVerifying
                        ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {t('onboarding.verifying')}
                          </>
                        )
                        : (
                          <>
                            <CheckCircle2 className="size-4" />
                            {t('onboarding.verifyButton')}
                            <ArrowRight className="ml-0.5 size-4" />
                          </>
                        )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="
                        h-9 w-full gap-1.5 text-xs text-muted-foreground
                        hover:text-foreground
                      "
                      disabled={isSending}
                      onClick={() => void handleSendCode()}
                    >
                      <RefreshCw className={`
                        size-3.5
                        ${isSending ? 'animate-spin' : ''}
                      `}
                      />
                      {t('onboarding.resendCode')}
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>

          <CardFooter className="
            flex justify-center border-t border-border/60 py-3.5 text-center
          "
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="
                h-8 gap-1.5 text-xs text-muted-foreground
                hover:text-foreground
                transition-colors
              "
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
            >
              {isLoggingOut
                ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {t('profileMenu.loggingOut')}
                  </>
                )
                : (
                  <>
                    <LogOut className="size-3.5" />
                    {t('onboarding.logoutPrompt')}
                  </>
                )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
