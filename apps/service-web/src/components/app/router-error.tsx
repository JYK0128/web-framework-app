import { type ErrorComponentProps, Link } from '@tanstack/react-router';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export function RouterError({ error, reset }: Partial<ErrorComponentProps<unknown>> & { error: unknown }) {
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <AlertTriangle className="size-8 text-destructive" />
            <CardTitle>페이지를 불러오지 못했습니다</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent />
          <CardFooter className="gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                if (reset) reset();
                else window.location.reload();
              }}
            >
              <RefreshCw />
              {' '}
              다시 시도
            </Button>
            <Button className="flex-1" variant="outline" render={<Link to="/" />}>
              <Home />
              {' '}
              홈으로
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
