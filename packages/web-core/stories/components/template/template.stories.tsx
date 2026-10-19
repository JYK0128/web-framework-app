import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { ArrowRight, FileText, LayoutDashboard, Users } from 'lucide-react';
import { useState } from 'react';

import { PermissionProvider } from '#context/permission';
import { Button, Card, CardContent, Skeleton } from '#ui';
import { Action, ActionCard, AppLayout, Link as TemplateLink, LinkCard, PageSection, ScreenLayout, SectionCard, SideMainLayout, StatsCard } from '#ui/template';

function ExamplePanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="grid gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TemplateCatalog() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid gap-8">
      <ExamplePanel title="PageSection: 제목, 설명, 액션, 콘텐츠와 로딩">
        <PageSection icon="users" title="고객 관리" description="고객 계정과 상태를 관리합니다." isLoading={loading}>
          <PageSection.Actions><Button size="sm">고객 추가</Button></PageSection.Actions>
          <PageSection.Content className="
            grid gap-3
            sm:grid-cols-2
          "
          >
            <SectionCard title="최근 가입" description="최근 7일" icon="users">
              <SectionCard.Content><strong>42명</strong></SectionCard.Content>
              <SectionCard.Actions><Button size="sm" variant="outline">전체 보기</Button></SectionCard.Actions>
            </SectionCard>
            <StatsCard label="활성 고객" value="1,284" icon="users" />
          </PageSection.Content>
          <PageSection.Skeleton>
            <div className="
              grid gap-3 p-2
              sm:grid-cols-2
            "
            >
              <div className="grid gap-3 rounded-lg border p-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="grid gap-3 rounded-lg border p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </PageSection.Skeleton>
        </PageSection>
        <Button size="sm" variant="outline" onClick={() => setLoading((value) => !value)}>
          {loading ? '로딩 해제' : 'PageSection 로딩 보기'}
        </Button>
      </ExamplePanel>

      <ExamplePanel title="SectionCard: 스타일, 크기, 슬롯과 로딩">
        <div className="
          grid gap-3
          sm:grid-cols-2
          xl:grid-cols-3
        "
        >
          {(['default', 'outline', 'secondary', 'ghost', 'destructive'] as const).map((variant) => (
            <SectionCard key={variant} title={`variant: ${variant}`} description="설명 텍스트" icon="file-text" variant={variant}>
              <SectionCard.Content><span>카드 본문</span></SectionCard.Content>
              <SectionCard.Actions><Button size="sm" variant="outline">작업</Button></SectionCard.Actions>
            </SectionCard>
          ))}
          {(['xs', 'sm', 'base', 'lg', 'xl', '2xl'] as const).map((textSize) => (
            <SectionCard key={textSize} title={`textSize: ${textSize}`} textSize={textSize}>
              <SectionCard.Content><span>본문 크기도 함께 조절됩니다.</span></SectionCard.Content>
            </SectionCard>
          ))}
          <SectionCard title="로딩 상태" isLoading>
            <SectionCard.Skeleton><Skeleton className="m-4 h-5 w-32" /></SectionCard.Skeleton>
          </SectionCard>
        </div>
      </ExamplePanel>

      <ExamplePanel title="StatsCard: 값과 로딩 스켈레톤">
        <div className="
          grid gap-3
          sm:grid-cols-3
        "
        >
          <StatsCard label="전체 사용자" value="12,408" icon="users" />
          <StatsCard label="이번 달 매출" value="₩8,420,000" icon="wallet" iconColor="text-emerald-500" textColor="text-emerald-600" />
          <StatsCard label="불러오는 중" value="-" isLoading />
        </div>
      </ExamplePanel>

      <ExamplePanel title="ActionCard: 변형, 설명 톤과 액션">
        <div className="
          grid gap-3
          sm:grid-cols-2
        "
        >
          {(['default', 'outline', 'secondary', 'ghost', 'destructive'] as const).map((variant) => (
            <ActionCard key={variant} icon={<Users />} title={`variant: ${variant}`} description="카드 오른쪽에 작업 버튼을 배치합니다." variant={variant}>
              <ActionCard.Actions>
                <Button size="sm" variant="outline">
                  열기
                  <ArrowRight />
                </Button>
              </ActionCard.Actions>
            </ActionCard>
          ))}
          <ActionCard icon={<FileText />} title="주의 안내" description="검토가 필요한 항목입니다." descriptionTone="warning" />
          <ActionCard icon={<FileText />} title="오류 안내" description="요청을 처리하지 못했습니다." descriptionTone="error" />
        </div>
      </ExamplePanel>

      <ExamplePanel title="권한 Action과 라우터 Link">
        <PermissionProvider permissions={['customer:create']}>
          <div className="flex flex-wrap items-center gap-3">
            <Action permission="customer:create">고객 생성 가능</Action>
            <Action
              permission="customer:delete"
              fallback={(
                <span className="text-sm text-muted-foreground">
                  삭제 권한 없음 (fallback)
                </span>
              )}
            >
              고객 삭제
            </Action>
            <TemplateLink to="/examples" variant="outline">라우터 링크 버튼</TemplateLink>
          </div>
        </PermissionProvider>
        <p className="text-sm text-muted-foreground">Action은 PermissionProvider의 권한 목록에 permission이 있을 때만 버튼을 렌더링합니다. Link는 앱의 TanStack Router 컨텍스트가 필요합니다.</p>
      </ExamplePanel>

      <ExamplePanel title="LinkCard: 기본, 활성, 미니와 접힘">
        <div className="
          grid gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
        >
          <LinkCard to="/examples" title="대시보드" description="서비스 현황을 확인합니다." icon={<LayoutDashboard />} />
          <LinkCard to="/examples" title="고객" description="고객 계정과 상태를 관리합니다." icon={<Users />} isActive />
          <LinkCard to="/examples" title="미니 메뉴" description="아이콘과 제목을 한 줄로 표시합니다." icon={<FileText />} mini />
          <LinkCard to="/examples" title="접힌 메뉴" description="제목은 툴팁과 접근성 이름으로 제공합니다." icon={<Users />} collapsed />
        </div>
      </ExamplePanel>

      <ExamplePanel title="ScreenLayout: 인증 화면 프레임">
        <div className="
          grid gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
        >
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div
              key={size}
              className="h-72 overflow-hidden rounded-md border bg-muted/30"
            >
              <ScreenLayout.Root>
                <ScreenLayout.Content size={size}>
                  <Card>
                    <CardContent className="p-4">
                      size="
                      {size}
                      " 콘텐츠
                    </CardContent>
                  </Card>
                </ScreenLayout.Content>
                <ScreenLayout.Addon><span>하단 안내 영역</span></ScreenLayout.Addon>
              </ScreenLayout.Root>
            </div>
          ))}
        </div>
      </ExamplePanel>

      <ExamplePanel title="SideMainLayout: 목록과 상세 화면">
        <div className="h-64 rounded-md border">
          <SideMainLayout>
            <SideMainLayout.Side>
              <Card className="h-full border border-border p-4">
                사이드 목록 영역 (lg 이상 20rem)
              </Card>
            </SideMainLayout.Side>
            <SideMainLayout.Main>
              <Card className="h-full border border-border p-4">
                메인 상세 영역
              </Card>
            </SideMainLayout.Main>
          </SideMainLayout>
        </div>
      </ExamplePanel>

      <ExamplePanel title="AppLayout: 앱 셸 슬롯">
        <div className="h-64 rounded-md border">
          <AppLayout.Root>
            <AppLayout.Sidebar className="w-48 shrink-0 border-r p-3">사이드바</AppLayout.Sidebar>
            <AppLayout.Main>
              <AppLayout.Header className="p-3">앱 헤더</AppLayout.Header>
              <AppLayout.Content className="p-3">스크롤 가능한 페이지 콘텐츠</AppLayout.Content>
            </AppLayout.Main>
          </AppLayout.Root>
        </div>
      </ExamplePanel>
    </div>
  );
}

const rootRoute = createRootRoute({ component: Outlet });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: TemplateCatalog });
const exampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/examples',
  component: () => (
    <p className="p-8">
      링크 대상 경로입니다. 브라우저 뒤로 가기로 예제로 돌아오세요.
    </p>
  ),
});
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, exampleRoute]), history: createMemoryHistory({ initialEntries: ['/'] }) });

function TemplateExamples() {
  return <RouterProvider router={router} />;
}

const meta = {
  title: '웹코어/템플릿/Template',
  component: TemplateExamples,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '템플릿 공개 API 전체 사용 예제입니다. PageSection, SectionCard, StatsCard, ActionCard, 권한 Action, 라우터 Link와 LinkCard, ScreenLayout, SideMainLayout, AppLayout을 확인할 수 있습니다. 저장·조회 같은 업무 동작과 권한 데이터는 앱에서 연결합니다.',
      },
    },
  },
} satisfies Meta<typeof TemplateExamples>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Template: Story = {};
