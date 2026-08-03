import { createFileRoute } from '@tanstack/react-router';

import { AppContent } from '#/components/layout/AppContent';
import { AppFooter } from '#/components/layout/AppFooter';
import { AppHeader } from '#/components/layout/AppHeader';
import { AppShell } from '#/components/layout/AppShell';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <AppHeader>
        헤더
      </AppHeader>
      <AppContent>
        바디
      </AppContent>
      <AppFooter>
        푸터
      </AppFooter>
    </AppShell>
  );
}
