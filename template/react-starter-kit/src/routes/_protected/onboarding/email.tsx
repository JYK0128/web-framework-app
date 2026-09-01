import { z } from '@pkg/shared/common';
import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Info, Loader2, LogOut, Mail, RefreshCw, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerUserProfileQueryKey, getAuthControllerUserProfileQueryOptions, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerIssueEmailChallenge, useOnboardingControllerVerifyEmail } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { useCountdown } from '#/hooks';

export const Route = createFileRoute('/_protected/onboarding/email')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    code: z.string().optional(),
  }),
  component: EmailOnboardingPage,
});

function EmailVerifyingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-semibold text-muted-foreground">
        이메일 인증 링크를 확인하고 있습니다...
      </p>
    </div>
  );
}

type EmailVerifyFailedStateProps = { isSending: boolean, onResend: () => void };

function EmailVerifyFailedState({ isSending, onResend }: EmailVerifyFailedStateProps) {
  return (
    <div className="grid gap-4">
      <div className="
        flex items-start gap-2.5 rounded-lg border border-destructive/20
        bg-destructive/5 text-xs/relaxed text-destructive
      "
      >
        <AlertCircle className="size-4 shrink-0" />
        <div>
          <p className="font-semibold">인증 링크가 만료되었거나 올바르지 않습니다.</p>
          <p className="text-[11px] text-muted-foreground">
            아래 버튼을 눌러 새로운 인증 링크를 요청해 주세요.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="lg"
        className="h-11 w-full gap-2 text-sm font-bold shadow-md"
        disabled={isSending}
        onClick={onResend}
      >
        <RefreshCw className={`
          size-4
          ${isSending ? 'animate-spin' : ''}
        `}
        />
        인증 메일 다시 발송
      </Button>
    </div>
  );
}

function EmailNotSentState({
  email,
  isSending,
  onSend,
}: {
  email: string
  isSending: boolean
  onSend: () => void
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-4">
      <div className="
        flex items-start gap-2.5 rounded-lg border border-primary/20
        bg-primary/5 text-xs/relaxed text-muted-foreground
      "
      >
        <Info className="size-4 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-foreground">
            {t('onboarding.emailDescription', { email })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            인증 메일 속 링크를 클릭하시면 본인 확인이 즉시 완료됩니다.
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-11 w-full gap-2 text-sm font-bold shadow-md transition-all"
        disabled={isSending}
        onClick={onSend}
      >
        {isSending
          ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              인증 메일 전송 중...
            </>
          )
          : (
            <>
              <Send className="size-4" />
              인증 메일 발송
              <ArrowRight className="size-4" />

            </>
          )}
      </Button>
    </div>
  );
}

function EmailSentState({
  email,
  isExpired,
  formattedTime,
  isSending,
  isChecking,
  onResend,
  onCheckVerified,
}: {
  email: string
  isExpired: boolean
  formattedTime: string
  isSending: boolean
  isChecking: boolean
  onResend: () => void
  onCheckVerified: () => void
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-4">
      <div className="
        rounded-lg border border-primary/20 bg-primary/5 text-center
      "
      >
        <div className="
          size-10 rounded-full bg-primary/10 text-primary flex items-center
          justify-center
        "
        >
          <Send className="size-5" />
        </div>
        <p className="font-bold text-sm text-foreground">
          인증 메일이 발송되었습니다!
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>{email}</strong>
          {' '}
          메일함에서
          <strong>[이메일 인증 완료하기]</strong>
          {' '}
          버튼을 클릭해 주세요.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">인증 링크 유효시간</span>
        <Badge
          variant="secondary"
          className="font-mono text-[11px] font-semibold"
        >
          {isExpired
            ? (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="size-3" />
                {t('onboarding.expired')}
              </span>
            )
            : (
              <span className="flex items-center gap-1 text-primary">
                <Clock className="size-3" />
                {formattedTime}
              </span>
            )}
        </Badge>
      </div>

      <div className="grid gap-2">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 text-sm font-bold shadow-md"
          disabled={isChecking || isSending}
          onClick={onCheckVerified}
        >
          {isChecking
            ? <Loader2 className="size-4 animate-spin" />
            : (
              <CheckCircle2 className="size-4" />
            )}
          인증 완료 확인
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="
            h-9 w-full gap-1.5 text-xs text-muted-foreground
            hover:text-foreground
          "
          disabled={isSending || isChecking}
          onClick={onResend}
        >
          <RefreshCw className={`
            size-3.5
            ${isSending ? 'animate-spin' : ''}
          `}
          />
          인증 메일 재발송
        </Button>
      </div>
    </div>
  );
}

function EmailOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const { challengeId, code } = Route.useSearch();

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [autoVerifyFailed, setAutoVerifyFailed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const countdown = useCountdown();

  const issueEmailChallengeMutation = useOnboardingControllerIssueEmailChallenge();
  const verifyEmailMutation = useOnboardingControllerVerifyEmail();
  const logoutMutation = useAuthControllerLogout();

  const isSending = issueEmailChallengeMutation.isPending;
  const isVerifying = verifyEmailMutation.isPending;
  const isLoggingOut = logoutMutation.isPending;
  const hasIncompleteChallenge = Boolean(challengeId || code) && (!challengeId || !code);

  const autoVerifyStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('onboarding-sync');
    channel.onmessage = async (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'EMAIL_VERIFIED') {
        await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        void navigate({ to: '/dashboard', replace: true });
      }
    };
    return () => {
      channel.close();
    };
  }, [navigate, queryClient]);

  useEffect(() => {
    if (!challengeId || !code || autoVerifyStartedRef.current) return;
    autoVerifyStartedRef.current = true;

    verifyEmailMutation.mutateAsync({ data: { challengeId, code } })
      .then(async () => {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('onboarding-sync');
          channel.postMessage({ type: 'EMAIL_VERIFIED' });
          channel.close();
        }
        await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        void navigate({ to: '/dashboard', replace: true });
      })
      .catch(() => {
        setAutoVerifyFailed(true);
      });
  }, [challengeId, code, navigate, queryClient, verifyEmailMutation]);

  const handleSendCode = async () => {
    const data = await issueEmailChallengeMutation.mutateAsync();
    setIsCodeSent(true);
    setAutoVerifyFailed(false);
    countdown.start(data?.expiresIn || 900);
  };

  const handleCheckVerified = async () => {
    setIsChecking(true);
    try {
      await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      const profile = await queryClient.fetchQuery(getAuthControllerUserProfileQueryOptions());
      if (profile?.emailVerified) {
        void navigate({ to: '/dashboard', replace: true });
      }
    }
    finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // Ignore error during cleanup
    }
    finally {
      queryClient.removeQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
    }
  };

  const isExpired = isCodeSent && countdown.isExpired;

  const renderContent = () => {
    if (challengeId && code && isVerifying) {
      return <EmailVerifyingState />;
    }
    if (autoVerifyFailed || hasIncompleteChallenge) {
      return <EmailVerifyFailedState isSending={isSending} onResend={() => void handleSendCode()} />;
    }
    if (!isCodeSent) {
      return <EmailNotSentState email={user.email} isSending={isSending} onSend={() => void handleSendCode()} />;
    }
    return (
      <EmailSentState
        email={user.email}
        isExpired={isExpired}
        formattedTime={countdown.formattedTime}
        isSending={isSending}
        isChecking={isChecking}
        onResend={() => void handleSendCode()}
        onCheckVerified={() => void handleCheckVerified()}
      />
    );
  };

  return (
    <div className="
      flex flex-col items-center justify-center bg-linear-to-b from-background
      via-muted/30 to-background
    "
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Onboarding Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="
            inline-flex items-center gap-2 rounded-full border border-primary/20
            bg-primary/10 text-xs font-semibold text-primary
          "
          >
            <span className="flex size-2 rounded-full bg-primary animate-pulse" />
            {t('onboarding.stepIndicator', { current: '3', total: '3' })}
            <span className="text-muted-foreground">·</span>
            <span>{t('onboarding.stepEmail')}</span>
          </div>

          <div className="h-1.5 w-40 rounded-full bg-muted">
            <div className="
              size-full rounded-full bg-primary transition-all duration-500
            "
            />
          </div>
        </div>

        {/* Main Card */}
        <Card className="
          border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl
        "
        >
          <CardHeader className="text-center">
            <div className="
              flex size-14 items-center justify-center rounded-2xl border
              border-primary/20 bg-linear-to-br from-primary/20 to-primary/5
              text-primary shadow-xs
            "
            >
              {user.emailVerified
                ? <CheckCircle2 className="size-7" />
                : (
                  <Mail className="size-7" />
                )}
            </div>

            <CardTitle className="text-xl font-extrabold tracking-tight">
              {t('onboarding.emailTitle')}
            </CardTitle>

            <CardDescription className="
              max-w-xs text-xs/relaxed text-muted-foreground
            "
            >
              {t('onboarding.emailSubtitle')}
            </CardDescription>

            <div className="flex items-center justify-center">
              <div className="
                inline-flex items-center gap-1.5 rounded-lg border border-border
                bg-muted/60 font-mono text-xs font-medium text-foreground
                shadow-2xs
              "
              >
                <Mail className="size-3.5 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6">
            {renderContent()}
          </CardContent>

          <CardFooter className="
            flex justify-center border-t border-border/60 text-center
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
