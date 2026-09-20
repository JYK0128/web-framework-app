import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';

import { getTermsControllerGetAgreementsV1QueryKey, useTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import { LoadingRouter } from '#/components/app/loading-router';
import { clearAuthState } from '#/store/auth';

export function AppGuard({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const agreementsQuery = useTermsControllerGetAgreementsV1(undefined, {
    query: { staleTime: 30_000 },
  });
  const agreements = agreementsQuery.data?.data.items;

  useEffect(() => {
    if (!agreements) return;

    const hasUnagreedRequiredTerm = agreements.some(
      (term) => term.isRequired && !term.isAgreed,
    );

    if (hasUnagreedRequiredTerm && location.pathname !== '/onboarding/terms') {
      void navigate({ to: '/onboarding/terms', replace: true });
    }
    else if (!hasUnagreedRequiredTerm && location.pathname === '/onboarding/terms') {
      void navigate({ to: '/profile', replace: true });
    }
  }, [agreements, location.pathname, navigate]);

  useEffect(() => {
    if (agreementsQuery.isError) {
      clearAuthState();
      queryClient.removeQueries({
        queryKey: getTermsControllerGetAgreementsV1QueryKey(),
      });
      void navigate({ to: '/login', replace: true });
    }
  }, [agreementsQuery.isError, navigate, queryClient]);

  if (agreementsQuery.isPending || agreementsQuery.isError) return <LoadingRouter />;
  return children;
}
