import { useState } from 'react';

import { useI18n } from '#context/i18n';
import { Button } from '#ui';

import { CookieConsentDetailsDialog } from './cookie-consent-details-dialog';

export type CookieConsentBannerProps = {
  visible: boolean
  authenticated?: boolean
  pending?: boolean
  onConsentChange: (analyticsAllowed: boolean) => void
};

export function CookieConsentBanner({
  visible,
  authenticated = false,
  pending = false,
  onConsentChange,
}: CookieConsentBannerProps) {
  const { t } = useI18n();
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
          className="
            fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50
            mx-auto flex max-h-[calc(100dvh-2rem)] max-w-7xl flex-col
            rounded-2xl border border-border bg-card p-4 text-card-foreground
            shadow-2xl
          "
        >
          <div className="
            flex flex-1 flex-col gap-4
            md:flex-row md:items-end md:justify-between
          "
          >
            <div className="scroll-y flex-1">
              <h2 id="cookie-consent-title" className="text-base font-bold">
                {t('core.cookieConsent.title')}
              </h2>
              <div
                id="cookie-consent-description"
                className="mt-1 space-y-1 text-sm/5 text-muted-foreground"
              >
                <p>
                  <strong className="font-semibold text-card-foreground">
                    {t('core.cookieConsent.essentialLabel')}
                  </strong>
                  {' '}
                  {t('core.cookieConsent.essentialDescription')}
                </p>
                <p>
                  <strong className="font-semibold text-card-foreground">
                    {t('core.cookieConsent.functionalLabel')}
                  </strong>
                  {' '}
                  {t('core.cookieConsent.functionalDescription')}
                </p>
                <p>
                  <strong className="font-semibold text-card-foreground">
                    {t('core.cookieConsent.analyticsLabel')}
                  </strong>
                  {' '}
                  {t('core.cookieConsent.analyticsDescription')}
                </p>
                {authenticated && (
                  <p className="text-xs font-medium text-primary/90">
                    {t('core.cookieConsent.multiDeviceNotice')}
                  </p>
                )}
                <div className="pt-1 text-xs">
                  <button
                    type="button"
                    className="
                      font-medium text-primary underline-offset-4
                      hover:underline
                    "
                    onClick={() => setDetailsOpen(true)}
                  >
                    {t('core.cookieConsent.details')}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => onConsentChange(false)}
              >
                {t('core.cookieConsent.essentialOnly')}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => onConsentChange(true)}
              >
                {t('core.cookieConsent.allowAnalytics')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <CookieConsentDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}
