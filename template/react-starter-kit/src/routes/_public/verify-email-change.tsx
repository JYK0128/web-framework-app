import { z } from '@pkg/shared/common';
import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerVerifyEmailChange } from '#/.generated/api/endpoints/auth/auth';
import type { VerifyEmailChangeResponseDto } from '#/.generated/api/model';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_public/verify-email-change')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  component: VerifyEmailChangePublicPage,
});

function VerifyEmailChangePublicPage() {
  const { t } = useI18n();
  const params = Route.useSearch();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : undefined;
  const token = typeof params.token === 'string' ? params.token : undefined;

  const queryClient = useQueryClient();
  const verifyEmailChangeMutation = useAuthControllerVerifyEmailChange();

  const isInvalidParams = !challengeId || !token;
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(() => (isInvalidParams ? 'error' : 'verifying'));
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isInvalidParams || !challengeId || !token || startedRef.current) return;
    startedRef.current = true;

    verifyEmailChangeMutation.mutateAsync({
      data: {
        challengeId,
        token,
      },
    })
      .then(async (res) => {
        const data: VerifyEmailChangeResponseDto = (res as { data?: VerifyEmailChangeResponseDto })?.data || (res);
        const email = data.email;
        setNewEmail(email);

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('email-change-sync');
          channel.postMessage({ type: 'EMAIL_CHANGED', email });
          channel.close();
        }

        await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [challengeId, token, isInvalidParams, queryClient, verifyEmailChangeMutation]);

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
              {status === 'verifying' && t('profile.verifyEmailChangeTitleVerifying')}
              {status === 'success' && t('profile.verifyEmailChangeTitleSuccess')}
              {status === 'error' && t('profile.verifyEmailChangeTitleError')}
            </CardTitle>

            <CardDescription className="
              mx-auto mt-2 max-w-sm text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {status === 'verifying' && t('profile.verifyEmailChangeDescVerifying')}
              {status === 'success' && (
                <>
                  {t('profile.verifyEmailChangeDescSuccess', { email: newEmail ?? '' })}
                </>
              )}
              {status === 'error' && t('profile.verifyEmailChangeDescError')}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-2">
            {status === 'success' && (
              <div className="
                rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-3.5
                text-center text-xs text-muted-foreground
                dark:bg-emerald-950/20
              "
              >
                <p className="font-semibold text-foreground">
                  {t('profile.verifyEmailChangeSyncNoticeTitle')}
                </p>
                <p className="mt-1 text-[11px]">
                  {t('profile.verifyEmailChangeSyncNoticeDesc')}
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
                  인증 링크가 만료되었거나 이미 완료된 요청입니다.
                  <br />
                  프로필 화면에서 새로운 변경 요청을 진행해 주세요.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/60 p-6">
            <Button asChild className="w-full" size="lg">
              <Link
                to="/profile"
                className="
                  inline-flex items-center justify-center gap-2 font-medium
                "
              >
                <User className="size-4" />
                <span>{t('profile.goToProfile')}</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
