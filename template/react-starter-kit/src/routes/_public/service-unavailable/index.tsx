import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw, ServerCrash } from 'lucide-react';

import { Button, Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/service-unavailable/')({
  head: () => ({
    meta: [{ title: 'Service Unavailable' }],
  }),
  component: ServiceUnavailablePage,
});

function ServiceUnavailablePage() {
  const { t } = useI18n();

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full flex flex-col justify-between shadow-xl">
          <CardContent className="
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
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full gap-1.5"
            >
              <RefreshCw className="size-4" />
              {t('serviceUnavailable.retry')}
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
