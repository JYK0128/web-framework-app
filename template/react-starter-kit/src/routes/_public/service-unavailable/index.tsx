import { createFileRoute, Link } from '@tanstack/react-router';
import { Copy, Home, RefreshCw, ServerCrash } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '#/.generated/shadcn/components/ui';
import { ScreenLayout, ScreenSectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/service-unavailable/')({
  head: () => ({
    meta: [{ title: 'Service Unavailable' }],
  }),
  component: ServiceUnavailablePage,
});

function ServiceUnavailablePage() {
  const { i18n, t } = useI18n();
  const language = i18n.language;

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const callback = params.get('callback') || '/';
  const errorMessage = params.get('message');

  const handleCopy = async () => {
    if (!errorMessage) return;
    try {
      await navigator.clipboard.writeText(errorMessage);
      toast.success(t('serviceUnavailable.copied'));
    }
    catch {
      toast.error(t('serviceUnavailable.copyFailed'));
    }
  };

  const handleRetry = () => {
    window.location.href = callback;
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <ScreenSectionCard className="
          w-full flex flex-col justify-between shadow-xl
        "
        >
          <ScreenSectionCard.Content className="
            grid justify-items-center gap-4 text-center p-6 py-8
          "
          >
            <div className="
              flex size-14 items-center justify-center rounded-full
              bg-destructive/10 text-destructive
            "
            >
              <ServerCrash className="size-7" aria-hidden="true" />
            </div>
            <div className="grid gap-1">
              <p className="text-xs font-semibold text-destructive">{t('serviceUnavailable.status')}</p>
              <h1 className="text-2xl font-bold tracking-tight">{t('serviceUnavailable.title')}</h1>
              <p className="whitespace-pre-line text-xs text-muted-foreground">
                {t('serviceUnavailable.description')}
              </p>
            </div>

            {errorMessage && (
              <div className="w-full mt-2 text-left">
                <div className="relative">
                  <pre className="
                    max-h-36 scroll-y rounded-md bg-muted p-2.5 pr-10 font-mono
                    text-xs text-muted-foreground whitespace-pre-wrap break-all
                  "
                  >
                    {errorMessage}
                  </pre>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1.5 right-1.5 text-muted-foreground"
                    onClick={() => void handleCopy()}
                    aria-label={t('serviceUnavailable.copy')}
                    title={t('serviceUnavailable.copy')}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </ScreenSectionCard.Content>

          <ScreenSectionCard.Footer className="
            flex w-full items-center justify-center gap-3
          "
          >
            <Button
              type="button"
              onClick={handleRetry}
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="size-4" />
              {t('serviceUnavailable.retry')}
            </Button>
            <Button
              type="button"
              variant="outline"
              render={(
                <Link
                  to="/{-$locale}"
                  params={{ locale: language }}
                />
              )}
              className="flex-1 gap-1.5"
            >
              <Home className="size-4" />
              {t('app.routerError.home') || '메인으로'}
            </Button>
          </ScreenSectionCard.Footer>
        </ScreenSectionCard>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
