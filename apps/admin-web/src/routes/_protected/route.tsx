import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/terms/terms';

function unauthenticatedOrThrow(error: unknown): null {
  if (error instanceof ApplicationError && error.status === 401) return null;
  if (isAxiosError(error) && error.response?.status === 401) return null;
  if (typeof error === 'object' && error !== null && 'status' in error && (error as { status?: number }).status === 401) return null;
  throw error;
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerMeV1QueryOptions({
        query: { staleTime: TimeUtil.ms.minute(1) },
      }))
      .catch(unauthenticatedOrThrow);

    if (!response) {
      throw redirect({ to: '/login' });
    }

    const agreements = await context.queryClient
      .fetchQuery(getTermsControllerGetAgreementsV1QueryOptions(undefined, {
        query: { staleTime: TimeUtil.ms.minute(1) },
      }))
      .catch(unauthenticatedOrThrow);

    if (!agreements) {
      throw redirect({ to: '/login' });
    }

    const hasUnagreedRequiredTerm = agreements.data.items.some(
      (term) => term.isRequired && !term.isAgreed,
    );

    if (hasUnagreedRequiredTerm && location.pathname !== '/onboarding/terms') {
      throw redirect({ to: '/onboarding/terms' });
    }

    if (!hasUnagreedRequiredTerm && location.pathname === '/onboarding/terms') {
      throw redirect({ to: '/dashboard' });
    }

    return {
      user: response.data,
      agreements: agreements.data.items,
    };
  },
  component: Outlet,
});
