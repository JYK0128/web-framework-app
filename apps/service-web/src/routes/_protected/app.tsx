import { DateUtil } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_protected/app')({
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useAuthControllerLogoutV1({
    mutation: {
      onSuccess: async () => {
        queryClient.clear();
        await navigate({ to: '/login', replace: true });
      },
    },
  });

  return (
    <div className="size-full p-6">
      <PageSection
        icon="layout-dashboard"
        title="대시보드"
        description="service-api와 연동된 서비스 시스템입니다."
      >
        <PageSection.Actions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate({ data: {} })}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </PageSection.Actions>

        <PageSection.Content className="
          mx-auto grid w-full max-w-5xl gap-6
          md:grid-cols-2
          pt-2
        "
        >
          <div className="
            flex flex-wrap gap-2
            md:col-span-2
          "
          >
            <Button variant="outline" render={<Link to="/faq" />}>FAQ</Button>
            <Button variant="outline" render={<Link to="/app/service-terms" />}>서비스 약관</Button>
          </div>
          <SectionCard
            icon="user"
            title="로그인 프로필"
            description="현재 세션 정보 (/api/v1/auth/me)"
          >
            <SectionCard.Content className="grid gap-3 p-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">이름</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">이메일</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">역할 (Role)</span>
                <span className="font-medium text-primary">
                  {user.roleCode}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">마지막 로그인</span>
                <span className="font-medium text-muted-foreground text-xs">
                  {DateUtil.dateTime.formatLocale(user.lastLoginAt)}
                </span>
              </div>
            </SectionCard.Content>
          </SectionCard>

          <SectionCard
            icon="shield"
            title="보유 권한 (Permissions)"
            description="RBAC 인가 정책에 의해 부여된 권한 목록입니다."
          >
            <SectionCard.Content className="p-4">
              <div className="flex flex-wrap gap-2">
                {user.permissions.length > 0
                  ? (
                    user.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="
                          inline-flex items-center rounded-md bg-primary/10
                          px-2.5 py-1 text-xs font-semibold text-primary
                        "
                      >
                        {permission}
                      </span>
                    ))
                  )
                  : (
                    <span className="text-muted-foreground text-sm">부여된 권한이 없습니다.</span>
                  )}
              </div>
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
