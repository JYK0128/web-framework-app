import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Button } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_protected/dashboard')({ component: DashboardPage });

function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="size-full scroll-y p-6">
      <PageSection icon="layout-dashboard" title="대시보드" description="관리자 운영 현황과 주요 관리 기능을 확인합니다.">
        <PageSection.Actions>
          <Button variant="outline" size="sm" onClick={() => { void navigate({ to: '/terms' }); }}>약관 관리</Button>
          <Button variant="outline" size="sm" onClick={() => { void navigate({ to: '/profile' }); }}>내 프로필</Button>
        </PageSection.Actions>
        <PageSection.Content className="
          grid max-w-5xl gap-6 pt-2
          md:grid-cols-2
        "
        >
          <SectionCard icon="file-check-2" title="약관 관리" description="온보딩 약관과 버전을 관리합니다.">
            <SectionCard.Content className="p-4 text-sm text-muted-foreground">약관 그룹별 초안 등록, 수정, 게시, 삭제를 관리할 수 있습니다.</SectionCard.Content>
          </SectionCard>
          <SectionCard icon="users" title="고객 관리" description="서비스 고객 현황을 확인합니다.">
            <SectionCard.Content className="p-4 text-sm text-muted-foreground">고객 목록과 상세 관리 기능이 준비되는 영역입니다.</SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
