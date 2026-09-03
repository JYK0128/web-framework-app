import { when, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2, LogIn, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerUserProfileQueryKey } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerVerifyEmail } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Button, Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/verify-email')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    code: z.string().optional(),
  }),
  component: VerifyEmailPublicPage,
});

function VerifyEmailPublicPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const params = Route.useSearch();
  const challengeId = when((value): value is string => typeof value === 'string', (value) => value)(params.challengeId);
  const code = when((value): value is string => typeof value === 'string', (value) => value)(params.code);

  const queryClient = useQueryClient();
  const verifyEmailMutation = useOnboardingControllerVerifyEmail();

  const isInvalidParams = !challengeId || !code;
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(() => (isInvalidParams ? 'error' : 'verifying'));
  const [countdown, setCountdown] = useState(10);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isInvalidParams || !challengeId || !code || startedRef.current) return;
    startedRef.current = true;

    verifyEmailMutation.mutateAsync({
      data: {
        challengeId,
        code,
      },
    })
      .then(async () => {
        setStatus('success');
        await queryClient.invalidateQueries({
          queryKey: getAuthControllerUserProfileQueryKey(),
        });
      })
      .catch(() => {
        setStatus('error');
      });
  }, [challengeId, code, isInvalidParams, queryClient, verifyEmailMutation]);

  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void navigate({ to: '/dashboard' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full flex flex-col justify-between shadow-xl">
          <CardContent className="
            flex-1 flex flex-col justify-center text-center p-6
          "
          >
            {status === 'verifying' && (
              <div className="grid gap-3 justify-items-center py-4">
                <div className="
                  flex size-12 items-center justify-center rounded-full
                  bg-primary/10 text-primary
                "
                >
                  <Loader2 className="size-6 animate-spin" />
                </div>
                <div className="grid gap-1">
                  <h2 className="text-base font-bold text-foreground">
                    {t('onboarding.verifyEmailTitleVerifying')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.verifyEmailDescVerifying')}
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="grid gap-3 justify-items-center py-4">
                <div className="
                  flex size-12 items-center justify-center rounded-full
                  bg-primary/10 text-primary
                "
                >
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="grid gap-1.5">
                  <h2 className="text-base font-bold text-foreground">
                    {t('onboarding.verifyEmailTitleSuccess')}
                  </h2>
                  <p className="text-xs/relaxed text-muted-foreground">
                    이메일 소유자 확인이 완료되었습니다.
                    <br />
                    <span className="font-semibold text-primary">
                      {countdown}
                      초 뒤 대시보드로 이동합니다.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="grid gap-3 justify-items-center py-4">
                <div className="
                  flex size-12 items-center justify-center rounded-full
                  bg-destructive/10 text-destructive
                "
                >
                  <AlertCircle className="size-6" />
                </div>
                <div className="grid gap-1.5">
                  <h2 className="text-base font-bold text-destructive">
                    {t('onboarding.verifyEmailTitleError')}
                  </h2>
                  <p className="text-xs/relaxed text-muted-foreground">
                    인증 링크가 만료되었거나 이미 완료된 요청입니다.
                    <br />
                    로그인 후 다시 인증을 진행해 주세요.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter>
            {status === 'success' && (
              <Button
                render={(
                  <Link to="/dashboard" />
                )}
                className="w-full"
              >
                <LogIn className="size-4" />
                <span>{t('onboarding.goToDashboard')}</span>
              </Button>
            )}

            {status === 'error' && (
              <Button
                render={(
                  <Link to="/login" />
                )}
                className="w-full"
              >
                <Mail className="size-4" />
                <span>{t('onboarding.goToLogin')}</span>
              </Button>
            )}
          </CardFooter>
        </Card>
      </ScreenLayout.Content>

      <ScreenLayout.Addon>
        <Link
          to="/login"
          className="
            text-xs text-muted-foreground
            hover:text-foreground
            transition-colors
          "
        >
          ←
          {' '}
          {t('auth.backToLogin')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
