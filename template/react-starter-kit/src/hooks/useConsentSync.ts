import { useEffect, useRef } from 'react';

import { useAuthControllerSyncAnalyticsConsent, useAuthControllerUserProfile } from '#/.generated/api/endpoints/auth/auth';
import { getAnalyticsConsentState, setAnalyticsConsent } from '#/core/analytics/ga4';

/**
 * Synchronizes cookie consent preferences across devices for authenticated users
 * in compliance with CNIL Multi-Device Consent guidance via a single sync endpoint.
 */
export function useConsentSync(nonce?: string): void {
  const { data: profile } = useAuthControllerUserProfile({
    query: { retry: false, staleTime: 60_000 },
  });
  const isAuthenticated = Boolean(profile?.id);

  const syncMutation = useAuthControllerSyncAnalyticsConsent();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedRef.current = false;
      return;
    }

    if (hasSyncedRef.current || syncMutation.isPending) return;

    hasSyncedRef.current = true;
    syncMutation.mutate({}, {
      onSuccess: () => {
        const currentConsent = getAnalyticsConsentState();
        if (currentConsent !== null) {
          setAnalyticsConsent(currentConsent, nonce);
        }
      },
    });
  }, [isAuthenticated, nonce, syncMutation]);
}
