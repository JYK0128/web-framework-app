import { getMaintenanceMessage } from '@pkg/shared/common';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { useSystemConfigsControllerGetConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { LoadingRouter } from '#/components/app/loading-router';
import { ScreenLayout } from '#/components/layout';
import { SYSTEM_CONFIG_REFRESH_INTERVAL_MS } from '#/configs/app.config';

export function Maintenance({ children }: PropsWithChildren) {
  const query = useSystemConfigsControllerGetConfigsV1({ query: { refetchInterval: SYSTEM_CONFIG_REFRESH_INTERVAL_MS } });
  const [now, setNow] = useState<Date>(() => new Date());
  const maintenance = query.data?.maintenance;
  const message = maintenance ? getMaintenanceMessage(maintenance, now) : undefined;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), SYSTEM_CONFIG_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  if (!query.data && query.isPending) return <LoadingRouter />;

  if (!query.data && query.isError) {
    return (
      <ScreenLayout>
        <ScreenLayout.Content>
          <Card className="w-full shadow-xl">
            <CardHeader>
              <CardTitle>서비스 상태를 확인할 수 없습니다</CardTitle>
              <CardDescription>점검 정보를 불러오지 못해 화면을 표시할 수 없습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
                {query.isFetching ? '다시 확인하는 중...' : '다시 확인'}
              </Button>
            </CardContent>
          </Card>
        </ScreenLayout.Content>
      </ScreenLayout>
    );
  }

  if (!message) return children;

  return (
    <div
      className="fixed inset-0 z-100 overflow-y-auto bg-background"
      role="status"
      aria-live="polite"
    >
      <ScreenLayout>
        <ScreenLayout.Content>
          <Card className="w-full shadow-xl">
            <CardHeader>
              <CardTitle>서비스 점검 중입니다</CardTitle>
              <CardDescription>안정적인 서비스 제공을 위해 점검을 진행하고 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{message}</p>
            </CardContent>
          </Card>
        </ScreenLayout.Content>
      </ScreenLayout>
    </div>
  );
}
