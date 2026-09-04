import { useState, useSyncExternalStore } from 'react';

import { useAuthControllerSyncAnalyticsConsent, useAuthControllerUserProfile } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { CookieConsentDetailsDialog } from '#/components/app/cookie-consent-details-dialog';
import { getAnalyticsConsentState, setAnalyticsConsent, subscribeToConsent } from '#/core/analytics/ga4';
import { useI18n } from '#/hooks';

type CookieConsentBannerProps = {
  nonce?: string
};

const getConsentSnapshot = () => getAnalyticsConsentState() === null;
const getServerConsentSnapshot = () => false;

export function CookieConsentBanner({ nonce }: CookieConsentBannerProps) {
  const { t } = useI18n();
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: profile } = useAuthControllerUserProfile({
    query: { retry: false, staleTime: 60_000 },
  });
  const isAuthenticated = Boolean(profile?.id);

  const syncConsentMutation = useAuthControllerSyncAnalyticsConsent();

  const isVisible = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  const handleUpdateConsent = async (granted: boolean) => {
    // 1. Update local client cookie and GA4 disable/enable status immediately
    setAnalyticsConsent(granted, nonce);

    // 2. If authenticated, synchronize with account (multi-device scope) in compliance with CNIL guidance
    if (isAuthenticated) {
      try {
        await syncConsentMutation.mutateAsync({ data: {} });
      }
      catch (error) {
        console.error('Failed to sync multi-device analytics consent to server:', error);
      }
    }
  };

  if (!isVisible) {
    return (
      <CookieConsentDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    );
  }

  return (
    <>
      <div
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        className="
          fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50
          mx-auto max-h-[calc(100dvh-2rem)] max-w-7xl overflow-y-auto
          rounded-2xl border border-border bg-card p-4 text-card-foreground
          shadow-2xl
        "
      >
        <div className="
          flex flex-col gap-4
          md:flex-row md:items-end md:justify-between
        "
        >
          <div className="flex-1">
            <h2 id="cookie-consent-title" className="text-base font-bold">
              {t('app.cookieConsent.title')}
            </h2>
            <div
              id="cookie-consent-description"
              className="mt-1 space-y-1 text-sm/5 text-muted-foreground"
            >
              <p>
                <strong className="font-semibold text-card-foreground">{t('app.cookieConsent.essentialLabel')}</strong>
                {' '}
                {t('app.cookieConsent.essentialDescription')}
              </p>
              <p>
                <strong className="font-semibold text-card-foreground">{t('app.cookieConsent.functionalLabel')}</strong>
                {' '}
                {t('app.cookieConsent.functionalDescription')}
              </p>
              <p>
                <strong className="font-semibold text-card-foreground">{t('app.cookieConsent.analyticsLabel')}</strong>
                {' '}
                {t('app.cookieConsent.analyticsDescription')}
              </p>
              {isAuthenticated && (
                <p className="text-xs text-primary/90 font-medium">
                  {t('app.cookieConsent.multiDeviceNotice')}
                </p>
              )}
              <div className="pt-1 text-xs">
                <button
                  type="button"
                  className="
                    font-medium text-primary underline-offset-4
                    hover:underline
                  "
                  onClick={() => setShowDetailsDialog(true)}
                >
                  {t('app.cookieConsent.details')}
                </button>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={syncConsentMutation.isPending}
              onClick={() => void handleUpdateConsent(false)}
            >
              {t('app.cookieConsent.essentialOnly')}
            </Button>
            <Button
              type="button"
              disabled={syncConsentMutation.isPending}
              onClick={() => void handleUpdateConsent(true)}
            >
              {t('app.cookieConsent.allowAnalytics')}
            </Button>
          </div>
        </div>
      </div>

      <CookieConsentDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </>
  );
}
