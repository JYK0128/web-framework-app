import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Loader2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerVerifyEmailChange } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

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
        const email = res?.email ?? null;
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
                    {t('profile.verifyEmailChangeTitleVerifying') || '이메일 변경 확인 중...'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    이메일 변경 정보를 확인하고 있습니다. 잠시만 기다려 주세요.
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
                    {t('profile.verifyEmailChangeTitleSuccess')}
                  </h2>
                  <p className="text-xs/relaxed text-muted-foreground">
                    {t('profile.verifyEmailChangeDescSuccess', { email: newEmail ?? '' })}
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
                    {t('profile.verifyEmailChangeTitleError')}
                  </h2>
                  <p className="text-xs/relaxed text-muted-foreground">
                    인증 링크가 만료되었거나 이미 완료된 요청입니다.
                    <br />
                    프로필 화면에서 새로운 변경 요청을 진행해 주세요.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              render={(
                <Link to="/profile" />
              )}
              className="w-full"
            >
              <User className="size-4" />
              <span>{t('profile.goToProfile')}</span>
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>

      <ScreenLayout.Addon>
        <Link
          to="/"
          className="
            text-xs text-muted-foreground
            hover:text-foreground
            transition-colors
          "
        >
          ←
          {' '}
          {t('auth.backToHome')}
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}
