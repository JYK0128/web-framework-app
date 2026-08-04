import { createFileRoute, Link } from '@tanstack/react-router';

import { AppContent, AppFooter, AppHeader, AppShell } from '#/components/layout';

export const Route = createFileRoute('/example/')({
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <AppHeader>
        헤더
      </AppHeader>
      <AppContent>
        <div className="space-y-3 p-4">
          <p>바디</p>
          <Link
            to="/example/loading"
            className="inline-flex cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            LoadingRouter 테스트 페이지로 이동
          </Link>
        </div>
      </AppContent>
      <AppFooter>
        푸터
      </AppFooter>
    </AppShell>
  );
}
