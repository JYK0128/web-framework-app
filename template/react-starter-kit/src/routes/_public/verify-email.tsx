import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2, Home, Loader2, LogIn, Mail } from 'lucide-react';
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
                mx-auto mb-3 flex size-14 items-center justify-center
                rounded-2xl border border-primary/20 bg-primary/10 text-primary
              "
              >
                <Loader2 className="size-7 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="
                mx-auto mb-3 flex size-14 items-center justify-center
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
                mx-auto mb-3 flex size-14 items-center justify-center
                rounded-2xl border border-destructive/20 bg-destructive/10
                text-destructive
              "
              >
                <AlertCircle className="size-7" />
              </div>
            )}

            <CardTitle className="
              text-xl font-extrabold tracking-tight
              sm:text-2xl
            "
            >
              {status === 'verifying' && '이메일 인증 확인 중...'}
              {status === 'success' && '이메일 인증이 완료되었습니다!'}
              {status === 'error' && '인증 링크가 유효하지 않습니다'}
            </CardTitle>

            <CardDescription className="
              mx-auto mt-1.5 max-w-xs text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {status === 'verifying' && '인증 토큰을 확인하고 있습니다. 잠시만 기다려 주세요.'}
              {status === 'success' && '이메일 소유권 확인이 정상 완료되었습니다. 기존에 열어두셨던 창으로 돌아가시거나 아래 버튼을 통해 이동해 주세요.'}
              {status === 'error' && '인증 링크가 만료되었거나 이미 사용된 링크입니다. 서비스 화면에서 새로운 인증 메일을 요청해 주세요.'}
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
                <p className="font-semibold text-foreground">💡 동일 기기/브라우저 안내</p>
                <p className="mt-1 text-[11px]">
                  원래 온보딩 창을 켜두셨다면 해당 창이 자동으로 대시보드로 전환됩니다.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="
            flex flex-col gap-2 border-t border-border/60 p-6
          "
          >
            {status === 'success' && (
              <div className="flex w-full gap-2">
                <Button asChild className="flex-1 gap-2 font-bold shadow-md" size="lg">
                  <Link to="/dashboard">
                    <LogIn className="size-4" />
                    대시보드로 이동
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/">
                    <Home className="size-4" />
                    홈
                  </Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <Button asChild className="w-full gap-2 font-bold shadow-md" size="lg">
                <Link to="/login">
                  <Mail className="size-4" />
                  로그인 화면으로 이동
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
