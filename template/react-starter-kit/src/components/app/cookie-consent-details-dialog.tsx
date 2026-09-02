import { Cookie, Settings2, Shield, Smartphone } from 'lucide-react';

import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

type CookieConsentDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
};

export function CookieConsentDetailsDialog({
  open,
  onOpenChange,
}: CookieConsentDetailsDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl flex flex-col p-6 gap-0">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cookie className="size-5 text-primary" />
            <span>{t('cookieConsent.title')}</span>
          </DialogTitle>
          <DialogDescription className="mt-1">
            {t('cookieConsent.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body Area - Starts from top */}
        <div className="
          flex-1 overflow-y-auto pr-1 space-y-4 py-2 text-sm
          text-muted-foreground
        "
        >
          {/* 1. Essential Cookies */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  {t('cookieConsent.essentialLabel')}
                </h4>
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('cookieConsent.alwaysActive')}
              </Badge>
            </div>
            <p className="mt-2 text-xs/relaxed">
              {t('cookieConsent.essentialDescription')}
            </p>
            <div className="mt-2.5 rounded-lg bg-background/60 p-2.5 text-xs">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong className="text-foreground">session</strong>
                  : 로그인 세션 및 사용자 인증 상태 유지 (세션 만료 시 삭제, HttpOnly)
                </li>
                <li>
                  <strong className="text-foreground">analytics_consent</strong>
                  : 사용자의 쿠키 동의/거부 결정 상태 보존 (보관 기간: 1년)
                </li>
              </ul>
            </div>
          </div>

          {/* 2. Functional Cookies */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  {t('cookieConsent.functionalLabel')}
                </h4>
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('cookieConsent.alwaysActive')}
              </Badge>
            </div>
            <p className="mt-2 text-xs/relaxed">
              {t('cookieConsent.functionalDescription')}
            </p>
            <div className="mt-2.5 rounded-lg bg-background/60 p-2.5 text-xs">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong className="text-foreground">i18next</strong>
                  : 사용자가 선택한 다국어 언어 환경(한국어 / 영어) 저장 (보관 기간: 1년)
                </li>
              </ul>
            </div>
          </div>

          {/* 3. Analytics Cookies */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  {t('cookieConsent.analyticsLabel')}
                </h4>
              </div>
              <Badge variant="outline" className="text-xs">
                {t('cookieConsent.optional')}
              </Badge>
            </div>
            <p className="mt-2 text-xs/relaxed">
              {t('cookieConsent.analyticsDescription')}
            </p>
            <div className="mt-2.5 rounded-lg bg-background/60 p-2.5 text-xs">
              <ul className="list-inside list-disc space-y-1">
                <li>
                  <strong className="text-foreground">_ga / _ga_* (Google Analytics 4)</strong>
                  : 고유 방문자 식별, 페이지뷰 및 사용성 통계 분석 (보관 기간: 최대 1년)
                </li>
                <li>
                  <strong className="text-foreground">제공받는 자</strong>
                  : Google LLC
                </li>
              </ul>
            </div>
          </div>

          {/* 4. CNIL Multi-Device Sync Notice */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-primary" />
              <h4 className="font-semibold text-foreground">
                {t('cookieConsent.multiDeviceDetailTitle')}
              </h4>
            </div>
            <p className="mt-2 text-xs/relaxed text-foreground/85">
              {t('cookieConsent.multiDeviceDetailDescription')}
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
