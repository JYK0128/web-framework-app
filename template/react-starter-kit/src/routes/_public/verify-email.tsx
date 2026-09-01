import { z } from '@pkg/shared/common';
import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2, LogIn, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerUserProfileQueryKey } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerVerifyEmail } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_public/verify-email')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    code: z.string().optional(),
  }),
  component: VerifyEmailPublicPage,
});

function VerifyEmailPublicPage() {
  const { t } = useI18n();
  const params = Route.useSearch();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : undefined;
  const code = typeof params.code === 'string' ? params.code : undefined;

  const queryClient = useQueryClient();
  const verifyEmailMutation = useOnboardingControllerVerifyEmail();

  const isInvalidParams = !challengeId || !code;
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(() => (isInvalidParams ? 'error' : 'verifying'));
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
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('onboarding-sync');
          channel.postMessage({ type: 'EMAIL_VERIFIED' });
          channel.close();
        }
        await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [challengeId, code, isInvalidParams, queryClient, verifyEmailMutation]);

  return (
    <div className="
      flex min-h-dvh flex-col items-center justify-center bg-linear-to-b
      from-background via-muted/30 to-background p-4
      sm:p-6
    "
    >
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card className="
          border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl
        "
        >
          <CardHeader className="pb-4 text-center">
            {status === 'verifying' && (
              <div className="
                mx-auto mb-4 flex size-14 items-center justify-center
                rounded-2xl border border-primary/20 bg-primary/10 text-primary
              "
              >
                <Loader2 className="size-7 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="
                mx-auto mb-4 flex size-14 items-center justify-center
                rounded-2xl border border-emerald-500/20 bg-emerald-50
                text-emerald-600
                dark:bg-emerald-950/40 dark:text-emerald-400
              "
              >
                <CheckCircle2 className="size-7" />
              </div>
            )}
            {status === 'error' && (
              <div className="
                mx-auto mb-4 flex size-14 items-center justify-center
                rounded-2xl border border-destructive/20 bg-destructive/10
                text-destructive
              "
              >
                <AlertCircle className="size-7" />
              </div>
            )}

            <CardTitle className="
              text-xl font-bold tracking-tight
              sm:text-2xl
            "
            >
              {status === 'verifying' && t('onboarding.verifyEmailTitleVerifying')}
              {status === 'success' && t('onboarding.verifyEmailTitleSuccess')}
              {status === 'error' && t('onboarding.verifyEmailTitleError')}
            </CardTitle>

            <CardDescription className="
              mx-auto mt-2 max-w-sm text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {status === 'verifying' && t('onboarding.verifyEmailDescVerifying')}
              {status === 'success' && t('onboarding.verifyEmailDescSuccess')}
              {status === 'error' && t('onboarding.verifyEmailDescError')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-2">
            {status === 'success' && (
              <div className="
                rounded-lg border border-emerald-500/20 bg-emerald-50/50
                dark:bg-emerald-950/20
                p-3.5 text-xs text-muted-foreground text-center
              "
              >
                <p className="font-semibold text-foreground">
                  {t('onboarding.verifyEmailSyncNoticeTitle')}
                </p>
                <p className="mt-1 text-[11px]">
                  {t('onboarding.verifyEmailSyncNoticeDesc')}
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="
                rounded-lg border border-destructive/20 bg-destructive/5 p-3.5
                text-center text-xs text-muted-foreground
                dark:bg-destructive/10
              "
              >
                <p className="text-[12px] leading-relaxed">
                  인증 토큰이 유효하지 않거나 이미 처리되었습니다.
                  <br />
                  로그인 화면으로 이동하여 다시 시도해 주세요.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/60 p-6">
            {status === 'success' && (
              <Button
                className="w-full"
                size="lg"
                render={(
                  <Link
                    to="/dashboard"
                    className="
                      inline-flex items-center justify-center gap-2 font-medium
                    "
                  >
                    <LogIn className="size-4" />
                    <span>{t('onboarding.goToDashboard')}</span>
                  </Link>
                )}
              />
            )}

            {status === 'error' && (
              <Button
                className="w-full"
                size="lg"
                render={(
                  <Link
                    to="/login"
                    className="
                      inline-flex items-center justify-center gap-2 font-medium
                    "
                  >
                    <Mail className="size-4" />
                    <span>{t('onboarding.goToLogin')}</span>
                  </Link>
                )}
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
