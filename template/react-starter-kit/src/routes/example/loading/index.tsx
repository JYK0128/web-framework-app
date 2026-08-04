import { createFileRoute, Link } from '@tanstack/react-router';
import { CheckCircle2, LoaderCircle } from 'lucide-react';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { loading } from '#/components/app';
import { AppContent, AppHeader, AppShell } from '#/components/layout';

// 1000ms 이상 걸리는 loader는 로딩 화면을 보여주도록 설정
const LOADING_DELAY_MS = 3000;

export const Route = createFileRoute('/example/loading/')({
  // 페이지 캐시 기간
  gcTime: 0,
  loader: {
    handler: async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, LOADING_DELAY_MS));
      return { loadedAt: Date.now() };
    },
  },
  component: LoadingDemoPage,
});

function LoadingDemoPage() {
  return (
    <AppShell>
      <AppHeader className="border-b border-border bg-background px-4 py-3">
        <h1 className="text-base font-semibold text-foreground">Loading Router 테스트</h1>
      </AppHeader>
      <AppContent className="space-y-4 bg-muted/30 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <CardTitle>로딩 완료</CardTitle>
            </div>
            <CardDescription>
              이 페이지의 loader가
              {' '}
              {LOADING_DELAY_MS / 1000}
              초 동안 대기한 뒤 렌더링됐어.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/example"
                className="
                  inline-flex h-8 items-center justify-center rounded-lg border
                  border-input bg-background px-3 text-sm font-medium
                  text-foreground transition-colors
                  hover:bg-muted
                "
              >
                홈으로
              </Link>
              <Badge variant="outline" className="gap-1.5">
                <LoaderCircle className="size-3.5" />
                LoadingRouter 확인용
              </Badge>
              <Button
                type="button"
                onClick={() => void loading(
                  () => new Promise<void>((resolve) => window.setTimeout(resolve, LOADING_DELAY_MS)),
                  { message: 'SystemLoading 테스트 중...' },
                )}
              >
                SystemLoading 테스트
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppContent>
    </AppShell>
  );
}
