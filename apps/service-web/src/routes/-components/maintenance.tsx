import { getMaintenanceMessage } from '@pkg/shared/policy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ScreenLayout } from '@pkg/web-core/ui';
import { useRouteContext } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

export function Maintenance({ children }: PropsWithChildren) {
  const { config } = useRouteContext({ from: '__root__' });
  const message = config?.maintenance
    ? getMaintenanceMessage(config.maintenance, new Date())
    : undefined;

  if (!message) return children;

  return (
    <div
      className="fixed inset-0 z-100 overflow-y-auto bg-background"
      role="status"
      aria-live="polite"
    >
      <ScreenLayout.Root>
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
      </ScreenLayout.Root>
    </div>
  );
}
