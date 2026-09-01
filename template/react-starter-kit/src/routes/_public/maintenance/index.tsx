import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { Construction } from 'lucide-react';

import { Button } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_public/maintenance/')({
  head: () => ({
    meta: [{ title: 'Service Maintenance' }],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="
          flex size-16 items-center justify-center rounded-full bg-primary/10
          text-primary
        "
        >
          <Construction className="size-8" aria-hidden="true" />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted-foreground">503</p>
          <h1 className="text-2xl font-semibold">{t('page.maintenance.title')}</h1>
          <p className="whitespace-pre-line text-muted-foreground">
            {t('page.maintenance.description')}
          </p>
        </div>
        <Button type="button" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </div>
    </main>
  );
}
