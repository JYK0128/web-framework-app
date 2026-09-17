import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { PageSection } from '#/components/layout';

export const Route = createFileRoute('/_protected/app')({
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();

  return (
    <div className="grid size-full grid-rows-[auto_1fr] p-4">
      <PageSection title="서비스" description="인증된 사용자 영역입니다.">
        <PageSection.Content className="p-2">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>현재 사용자</CardTitle>
              <CardDescription>service-api의 `/api/v1/me` 응답입니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p>
                <strong>사용자 ID:</strong>
                {' '}
                {user.userId}
              </p>
              <p>
                <strong>영역:</strong>
                {' '}
                {user.plane}
              </p>
              <p>
                <strong>요청 ID:</strong>
                {' '}
                {user.requestId ?? '-'}
              </p>
            </CardContent>
          </Card>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
