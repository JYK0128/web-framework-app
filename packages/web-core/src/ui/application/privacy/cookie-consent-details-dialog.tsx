import { Cookie, Settings2, Shield, Smartphone } from 'lucide-react';

import { useI18n } from '#context/i18n';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#ui';

export type CookieConsentDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
};

export function CookieConsentDetailsDialog({ open, onOpenChange }: CookieConsentDetailsDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl flex flex-col gap-0 p-6">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cookie className="size-5 text-primary" />
            <span>{t('app.cookieConsent.title')}</span>
          </DialogTitle>
          <DialogDescription className="mt-1">
            {t('app.cookieConsent.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="
          scroll-y flex-1 space-y-4 py-2 text-sm text-muted-foreground
        "
        >
          <section className="
            rounded-xl border border-border/80 bg-muted/30 p-4
          "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  {t('app.cookieConsent.essentialLabel')}
                </h4>
              </div>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                {t('app.cookieConsent.alwaysActive')}
              </span>
            </div>
            <p className="mt-2 text-xs/relaxed">
              {t('app.cookieConsent.essentialDescription')}
            </p>
            <div className="mt-2.5 rounded-lg bg-background/60 p-2.5 text-xs">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong className="text-foreground">session</strong>
                  :
                  {' '}
                  {t('app.cookieConsent.sessionDetail')}
                </li>
                <li>
                  <strong className="text-foreground">analytics_consent</strong>
                  :
                  {' '}
                  {t('app.cookieConsent.consentCookieDetail')}
                </li>
              </ul>
            </div>
          </section>

          <section className="
            rounded-xl border border-border/80 bg-muted/30 p-4
          "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  {t('app.cookieConsent.functionalLabel')}
                </h4>
              </div>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                {t('app.cookieConsent.alwaysActive')}
              </span>
            </div>
            <p className="mt-2 text-xs/relaxed">
              {t('app.cookieConsent.functionalDescription')}
            </p>
            <div className="mt-2.5 rounded-lg bg-background/60 p-2.5 text-xs">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong className="text-foreground">i18next</strong>
                  :
                  {' '}
                  {t('app.cookieConsent.languageCookieDetail')}
                </li>
              </ul>
            </div>
          </section>

          <section className="
            rounded-xl border border-border/80 bg-muted/30 p-4
          "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  {t('app.cookieConsent.analyticsLabel')}
                </h4>
              </div>
              <span className="rounded-md border px-2 py-0.5 text-xs">
                {t('app.cookieConsent.optional')}
              </span>
            </div>
            <p className="mt-2 text-xs/relaxed">
              {t('app.cookieConsent.analyticsDescription')}
            </p>
            <div className="mt-2.5 rounded-lg bg-background/60 p-2.5 text-xs">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong className="text-foreground">_ga / _ga_* (Google Analytics 4)</strong>
                  :
                  {' '}
                  {t('app.cookieConsent.analyticsCookieDetail')}
                </li>
                <li>
                  <strong className="text-foreground">{t('app.cookieConsent.dataRecipientLabel')}</strong>
                  : Google LLC
                </li>
              </ul>
            </div>
          </section>

          <section className="
            rounded-xl border border-primary/20 bg-primary/5 p-4
          "
          >
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-primary" />
              <h4 className="font-semibold text-foreground">
                {t('app.cookieConsent.multiDeviceDetailTitle')}
              </h4>
            </div>
            <p className="mt-2 text-xs/relaxed text-foreground/85">
              {t('app.cookieConsent.multiDeviceDetailDescription')}
            </p>
          </section>
        </div>

        <DialogFooter className="mt-2 shrink-0 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('app.dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
