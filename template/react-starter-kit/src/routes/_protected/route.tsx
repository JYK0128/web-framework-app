import { createFileRoute, redirect } from '@tanstack/react-router';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsQueryOptions } from '#/.generated/api/endpoints/terms/terms';
import { unauthenticatedOrThrow } from '#/core/auth/query-error';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    // 1. 인증(로그인) 확인 (fetchQuery로 최신 상태 보장, 401 시 null로 안전 처리)
    const profile = await context.queryClient
      .fetchQuery(getAuthControllerUserProfileQueryOptions({
        query: { staleTime: 60_000, gcTime: 60_000 },
      }))
      .catch(unauthenticatedOrThrow);

    if (!profile) {
      throw redirect({ to: '/login' });
    }

    // 2. 사용자의 현재 약관 동의 현황 조회 (fetchQuery로 최신 상태 보장)
    const agreements = await context.queryClient
      .fetchQuery(getTermsControllerGetAgreementsQueryOptions({
        query: { staleTime: 60_000, gcTime: 60_000 },
      }))
      .catch(unauthenticatedOrThrow);

    if (!agreements) {
      throw redirect({ to: '/login' });
    }

    // 3. 온보딩 - 이메일 검증
    if (!profile.email.trim() || !profile.emailVerified) {
      if (location.pathname !== '/onboarding/email') {
        throw redirect({ to: '/onboarding/email' });
      }

      return { user: profile, agreements };
    }

    // 4. 온보딩 - 필수 약관 동의
    if (agreements.terms.some((t) => t.isRequired && !t.isAgreed)) {
      if (location.pathname !== '/onboarding/term') {
        throw redirect({ to: '/onboarding/term' });
      }

      return { user: profile, agreements };
    }

    // 5. 온보딩 - 휴대폰 인증
    if (!profile.phoneNumber?.trim() || !profile.phoneNumberVerified) {
      if (location.pathname !== '/onboarding/phone') {
        throw redirect({ to: '/onboarding/phone' });
      }

      return { user: profile, agreements };
    }

    // 6. 온보딩 완료 - 대시보드 이동
    if (location.pathname.startsWith('/onboarding')) {
      throw redirect({ to: '/dashboard' });
    }

    return { user: profile, agreements };
  },
});
