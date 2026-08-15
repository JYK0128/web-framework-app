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
          시스템 환경 설정 및 전역 운영 정책을 관리합니다.
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
          <CardTitle className="text-lg">준비 중인 페이지입니다</CardTitle>
          <CardDescription className="max-w-md text-sm">
            시스템 설정 기능은 현재 개발 예정입니다. 곧 업데이트될 예정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 p-0" />
      </Card>
    </div>
  );
}
