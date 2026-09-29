import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { authControllerRefreshV1, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { LinkButton, ScreenLayout } from '#/components/layout';
import { authUserAtom, tokenStorage, tokenStore } from '#/store/token';

export const Route = createFileRoute('/_global/oauth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    callback: typeof search.callback === 'string' ? search.callback : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { callback, error } = Route.useSearch();
  const started = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string>(() => error ? getOAuthErrorMessage(error) : '');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (error) return;

    void (async () => {
      try {
        const refresh = await authControllerRefreshV1({});
        if (!refresh.data.accessToken) throw new Error('세션을 복구하지 못했습니다.');
        tokenStorage.setAccessToken(refresh.data.accessToken);
        const me = await queryClient.fetchQuery(getAuthControllerMeV1QueryOptions({ query: { retry: false, staleTime: 0 } }));
        tokenStore.set(authUserAtom, me.data);
        await queryClient.invalidateQueries();
        await router.invalidate();
        router.history.replace(resolveDestination(callback));
      }
      catch {
        tokenStorage.clear();
        setErrorMessage('외부 계정 로그인 후 세션을 복구하지 못했습니다. 다시 시도해 주세요.');
      }
    })();
  }, [callback, error, queryClient, router]);

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">외부 계정 로그인</CardTitle>
            <CardDescription>{errorMessage ? '로그인 처리 중 문제가 발생했습니다.' : '로그인 정보를 확인하고 있습니다.'}</CardDescription>
          </CardHeader>
          {errorMessage && (
            <CardContent className="grid gap-4">
              <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
              <LinkButton to="/login">로그인으로 돌아가기</LinkButton>
            </CardContent>
          )}
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}

function resolveDestination(callback?: string): string {
  if (!callback) return '/qna';
  try {
    const url = new URL(callback, window.location.origin);
    if (url.origin !== window.location.origin) return '/qna';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/qna';
  }
}

function getOAuthErrorMessage(code: string): string {
  switch (code) {
    case 'TWO_FACTOR_REQUIRED_FOR_OAUTH': return '이 계정은 2단계 인증을 사용합니다. 이메일과 비밀번호로 로그인해 인증 코드를 입력해 주세요.';
    case 'EMAIL_VERIFICATION_REQUIRED': return '이메일 인증을 완료한 뒤 로그인해 주세요.';
    case 'REGISTRATION_DISABLED': return '현재 새 계정 가입을 사용할 수 없습니다.';
    case 'OAUTH_VERIFIED_EMAIL_REQUIRED': return '공급자가 검증된 이메일을 제공하지 않습니다. 관리자에게 문의해 주세요.';
    case 'OAUTH_CANCELLED': return '공급자 로그인을 취소했습니다.';
    default: return '외부 계정 로그인을 완료하지 못했습니다. 다시 시도해 주세요.';
  }
}
