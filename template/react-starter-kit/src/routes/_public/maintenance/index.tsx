import { createFileRoute } from '@tanstack/react-router';
import { Construction, RefreshCw } from 'lucide-react';

import { useSystemConfigControllerGetSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import { Button, Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';
import { useI18n } from '#/hooks';

export const Route = createFileRoute('/_public/maintenance/')({
  head: () => ({
    meta: [{ title: 'Service Maintenance' }],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { t } = useI18n();
  const { data: config } = useSystemConfigControllerGetSystemConfig({
    query: { staleTime: 10_000, gcTime: 30_000 },
  });

  const message = config?.maintenanceMessage || config?.operatingStatus?.message || t('maintenance.description');

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
              bg-amber-500/10 text-amber-600
              dark:text-amber-500
            "
            >
              <Construction className="size-7" aria-hidden="true" />
            </div>
            <div className="grid gap-1.5">
              <p className="
                text-xs font-semibold text-amber-600
                dark:text-amber-500
              "
              >
                503 Service Maintenance
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{t('maintenance.title')}</h1>
              <p className="
                whitespace-pre-line text-xs text-muted-foreground mt-1
              "
              >
                {message}
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full gap-1.5"
            >
              <RefreshCw className="size-4" />
              {t('maintenance.retry') || '다시 시도'}
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
