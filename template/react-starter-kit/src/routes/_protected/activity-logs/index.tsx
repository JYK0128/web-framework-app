import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { Activity, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/activity-logs/')({
  component: ActivityLogsPageComponent,
});

function ActivityLogsPageComponent() {
  const { t } = useI18n();

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      <div>
        <h1 className="
          flex items-center gap-2 text-2xl font-bold tracking-tight
        "
        >
          <Activity className="size-6 text-primary" />
          {t('navigation.activityLogs')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('activityLogs.description')}
        </p>
      </div>

      <Card className="
        flex flex-col items-center justify-center p-12 text-center
      "
      >
        <div className="
          flex size-14 items-center justify-center rounded-full bg-muted
          text-muted-foreground
        "
        >
          <Clock className="size-7" />
        </div>
        <CardHeader className="p-0 pt-4">
          <CardTitle className="text-lg">{t('activityLogs.underConstructionTitle')}</CardTitle>
          <CardDescription className="max-w-md text-sm">
            {t('activityLogs.underConstructionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 p-0" />
      </Card>
    </div>
  );
}
