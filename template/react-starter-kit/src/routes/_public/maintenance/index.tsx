import { createFileRoute } from '@tanstack/react-router';
import { Construction } from 'lucide-react';

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
              bg-primary/10 text-primary
            "
            >
              <Construction className="size-7" aria-hidden="true" />
            </div>
            <div className="grid gap-1">
              <p className="text-xs font-semibold text-muted-foreground">503</p>
              <h1 className="text-2xl font-bold tracking-tight">{t('maintenance.title')}</h1>
              <p className="whitespace-pre-line text-xs text-muted-foreground">
                {t('maintenance.description')}
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              {t('maintenance.retry') || '다시 시도'}
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
