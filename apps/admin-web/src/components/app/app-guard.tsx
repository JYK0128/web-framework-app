import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { type ReactNode, useEffect } from 'react';

import { getAuthControllerGetPolicyV1QueryKey, useAuthControllerGetPolicyV1 } from '#/.generated/api/endpoints/auth/auth';
import { getOperatorTermsControllerGetAgreementsV1QueryKey, useOperatorTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import { LoadingRouter } from '#/components/app/loading-router';
import { OPERATOR_TERMS_QUERY_STALE_TIME_MS } from '#/configs/app.config';
import { authUserAtom, clearAuthState } from '#/store/auth';

export function AppGuard({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAtomValue(authUserAtom);
  const policyQuery = useAuthControllerGetPolicyV1();
  const policy = policyQuery.data;
  const mustSetupSecurity = Boolean(
    (policy?.twoFactorRequired && !user?.twoFactorEnabled)
    || (policy?.identityVerificationRequired && !user?.phoneNumberVerified)
    || user?.passwordExpired,
  );
  const agreementsQuery = useOperatorTermsControllerGetAgreementsV1(undefined, {
    query: { staleTime: OPERATOR_TERMS_QUERY_STALE_TIME_MS, enabled: policyQuery.isSuccess && !mustSetupSecurity },
  });
  const agreements = agreementsQuery.data?.items;

  useEffect(() => {
    if (!policyQuery.isSuccess) return;
    if (mustSetupSecurity) {
      if (location.pathname !== '/profile') void navigate({ to: '/profile', replace: true });
      return;
    }
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
  }, [agreements, location.pathname, mustSetupSecurity, navigate, policyQuery.isSuccess]);

  useEffect(() => {
    if (!policyQuery.isError) return;
    clearAuthState();
    queryClient.removeQueries({ queryKey: getAuthControllerGetPolicyV1QueryKey() });
    void navigate({ to: '/login', replace: true });
  }, [navigate, policyQuery.isError, queryClient]);

  useEffect(() => {
    if (agreementsQuery.isError && !mustSetupSecurity) {
      clearAuthState();
      queryClient.removeQueries({
        queryKey: getOperatorTermsControllerGetAgreementsV1QueryKey(),
      });
      void navigate({ to: '/login', replace: true });
    }
  }, [agreementsQuery.isError, mustSetupSecurity, navigate, queryClient]);

  if (policyQuery.isPending || policyQuery.isError) return <LoadingRouter />;
  if (mustSetupSecurity) return location.pathname === '/profile' ? children : <LoadingRouter />;
  if (agreementsQuery.isPending || agreementsQuery.isError) return <LoadingRouter />;
  return children;
}
