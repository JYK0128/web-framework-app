import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Info, Loader2, RefreshCw, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerUserProfileQueryKey } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerIssueEmailChallenge, useOnboardingControllerVerifyEmail } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useCountdown, useI18n } from '#/hooks';

import { OnboardingLayout } from './-components/onboarding-layout';

export const Route = createFileRoute('/_protected/onboarding/email')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    code: z.string().optional(),
  }),
  component: EmailOnboardingPage,
});

function EmailVerifyingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-semibold text-muted-foreground">
        이메일 인증 링크를 확인하고 있습니다...
      </p>
    </div>
  );
}

function EmailVerifyFailedState() {
  return (
    <div className="
      flex items-start gap-2.5 rounded-lg border border-destructive/20
      bg-destructive/5 p-3.5 text-xs/relaxed text-destructive
    "
    >
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">
          인증 링크가 만료되었거나 올바르지 않습니다.
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          아래 버튼을 눌러 새로운 인증 링크를 요청해 주세요.
        </p>
      </div>
    </div>
  );
}

function EmailNotSentState({ email }: { email: string }) {
  const { t } = useI18n();

  return (
    <div className="
      flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5
      p-3.5 text-xs/relaxed text-muted-foreground
    "
    >
      <Info className="size-4 shrink-0 text-primary mt-0.5" />
      <div>
        <p className="font-semibold text-foreground">
          {t('onboarding.emailDescription', { email })}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          인증 메일 속 링크를 클릭하시면 본인 확인이 즉시 완료됩니다.
        </p>
      </div>
    </div>
  );
}

function EmailSentState({
  email,
  isExpired,
  formattedTime,
}: {
  email: string
  isExpired: boolean
  formattedTime: string
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3">
      <div className="
        rounded-lg border border-primary/20 bg-primary/5 p-4 text-center grid
        gap-2
      "
      >
        <div className="
          mx-auto size-10 rounded-full bg-primary/10 text-primary flex
          items-center justify-center
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
          {' '}
          <strong>[이메일 인증 완료하기]</strong>
          {' '}
          버튼을 클릭해 주세요.
        </p>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          인증 링크 유효시간
        </span>
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
    </div>
  );
}

function EmailOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const { challengeId, code } = Route.useSearch();

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [autoVerifyFailed, setAutoVerifyFailed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const countdown = useCountdown();

  const issueEmailChallengeMutation
    = useOnboardingControllerIssueEmailChallenge();
  const verifyEmailMutation = useOnboardingControllerVerifyEmail();

  const isSending = issueEmailChallengeMutation.isPending;
  const isVerifying = verifyEmailMutation.isPending;
  const hasIncompleteChallenge
    = Boolean(challengeId || code) && (!challengeId || !code);

  const autoVerifyStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window))
      return;
    const channel = new BroadcastChannel('onboarding-sync');
    channel.onmessage = async (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'EMAIL_VERIFIED') {
        await queryClient.invalidateQueries({
          queryKey: getAuthControllerUserProfileQueryKey(),
        });
        await router.invalidate();
      }
    };
    return () => {
      channel.close();
    };
  }, [router, queryClient]);

  useEffect(() => {
    if (!challengeId || !code || autoVerifyStartedRef.current) return;
    autoVerifyStartedRef.current = true;

    verifyEmailMutation
      .mutateAsync({ data: { challengeId, code } })
      .then(async () => {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('onboarding-sync');
          channel.postMessage({ type: 'EMAIL_VERIFIED' });
          channel.close();
        }
        await queryClient.invalidateQueries({
          queryKey: getAuthControllerUserProfileQueryKey(),
        });
        await router.invalidate();
      })
      .catch(() => {
        setAutoVerifyFailed(true);
      });
  }, [challengeId, code, router, queryClient, verifyEmailMutation]);

  const handleSendCode = async () => {
    const data = await issueEmailChallengeMutation.mutateAsync();
    setIsCodeSent(true);
    setAutoVerifyFailed(false);
    countdown.start(data?.expiresIn || 900);
  };

  const handleCheckVerified = async () => {
    setIsChecking(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: getAuthControllerUserProfileQueryKey(),
      });
      await router.invalidate();
    }
    finally {
      setIsChecking(false);
    }
  };

  const isExpired = isCodeSent && countdown.isExpired;

  const renderContent = () => {
    if (challengeId && code && isVerifying) {
      return <EmailVerifyingState />;
    }
    if (autoVerifyFailed || hasIncompleteChallenge) {
      return <EmailVerifyFailedState />;
    }
    if (!isCodeSent) {
      return <EmailNotSentState email={user.email} />;
    }
    return (
      <EmailSentState
        email={user.email}
        isExpired={isExpired}
        formattedTime={countdown.formattedTime}
      />
    );
  };

  const renderFooter = () => {
    if (challengeId && code && isVerifying) {
      return null;
    }
    if (autoVerifyFailed || hasIncompleteChallenge) {
      return (
        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 text-sm font-bold shadow-md"
          disabled={isSending}
          onClick={() => void handleSendCode()}
        >
          <RefreshCw className={`
            size-4
            ${isSending ? 'animate-spin' : ''}
          `}
          />
          인증 메일 다시 발송
        </Button>
      );
    }
    if (!isCodeSent) {
      return (
        <Button
          type="button"
          size="lg"
          className="
            h-11 w-full gap-2 text-sm font-bold shadow-md transition-all
          "
          disabled={isSending}
          onClick={() => void handleSendCode()}
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
      );
    }
    return (
      <div className="grid gap-2 w-full">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 text-sm font-bold shadow-md"
          disabled={isChecking || isSending}
          onClick={() => void handleCheckVerified()}
        >
          {isChecking
            ? (
              <Loader2 className="size-4 animate-spin" />
            )
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
          onClick={() => void handleSendCode()}
        >
          <RefreshCw className={`
            size-3.5
            ${isSending ? 'animate-spin' : ''}
          `}
          />
          인증 메일 재발송
        </Button>
      </div>
    );
  };

  return (
    <OnboardingLayout
      icon={user.emailVerified ? 'check-circle-2' : 'mail'}
      title={t('onboarding.emailTitle')}
      description={t('onboarding.emailSubtitle')}
      footer={renderFooter()}
    >
      {renderContent()}
    </OnboardingLayout>
  );
}
