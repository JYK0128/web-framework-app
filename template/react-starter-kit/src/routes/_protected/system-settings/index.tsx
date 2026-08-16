import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { Settings, Wrench } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/system-settings/')({
  component: SystemSettingsPageComponent,
});

function SystemSettingsPageComponent() {
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
          <Settings className="size-6 text-primary" />
          {t('navigation.systemSettings')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('systemSettings.description')}
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
          <Wrench className="size-7" />
        </div>
        <CardHeader className="p-0 pt-4">
          <CardTitle className="text-lg">{t('systemSettings.underConstructionTitle')}</CardTitle>
          <CardDescription className="max-w-md text-sm">
            {t('systemSettings.underConstructionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 p-0" />
      </Card>
    </div>
  );
}
