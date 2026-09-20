import { DateUtil } from '@pkg/shared/common';
import { createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { FileText, User } from 'lucide-react';

import { useTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import { Button } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';
import { useHashTab } from '#/lib/use-hash-tab';
import { authUserAtom } from '#/store/auth';

import { ProfileTermsTab } from './-profile-terms-tab';

const PROFILE_TABS = ['overview', 'terms'] as const;

export const Route = createFileRoute('/_protected/_app/profile')({ component: ProfilePage });

function ProfilePage() {
  const user = useAtomValue(authUserAtom);
  const agreementsQuery = useTermsControllerGetAgreementsV1(undefined, {
    query: { staleTime: 30_000 },
  });
  const agreements = agreementsQuery.data?.data.items ?? [];
  const [activeTab, setActiveTab] = useHashTab(PROFILE_TABS, 'overview');
  if (!user) return null;
  const agreedCount = agreements.filter((agreement) => agreement.isAgreed).length;

  return (
    <PageSection icon="user" title="내 프로필" description="현재 로그인한 관리자 계정과 권한 정보입니다.">
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
      "
      >
        <div className="flex w-full items-center justify-start border-b">
          <Button
            variant="ghost"
            className={activeTab === 'overview'
              ? `rounded-none border-b-2 border-primary`
              : `rounded-none`}
            onClick={() => setActiveTab('overview')}
          >
            <User className="size-4" />
            계정 정보
          </Button>
          <Button
            variant="ghost"
            className={activeTab === 'terms'
              ? `rounded-none border-b-2 border-primary`
              : `rounded-none`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText className="size-4" />
            약관
            {' '}
            (
            {agreedCount}
            /
            {agreements.length}
            )
          </Button>
        </div>
        <div className="scroll-y">
          {activeTab === 'overview' && (
            <div className="
              grid gap-6
              md:grid-cols-2
            "
            >
              <SectionCard icon="user" title="계정 정보" description="인증된 관리자 정보">
                <SectionCard.Content className="grid gap-3 p-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">이름</span>
                    <span className="font-medium">
                      {user.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">이메일</span>
                    <span className="font-medium">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">역할</span>
                    <span className="font-medium text-primary">
                      {user.roleCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">마지막 로그인</span>
                    <span className="font-medium text-muted-foreground text-xs">
                      {DateUtil.dateTime.formatLocale(user.lastLoginAt)}
                    </span>
                  </div>
                </SectionCard.Content>
              </SectionCard>
              <SectionCard icon="shield" title="보유 권한" description="RBAC 인가 정책에 의해 부여된 권한">
                <SectionCard.Content className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.length > 0
                      ? user.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="
                            inline-flex rounded-md bg-primary/10 px-2.5 py-1
                            text-xs font-semibold text-primary
                          "
                        >
                          {permission}
                        </span>
                      ))
                      : (
                        <span className="text-sm text-muted-foreground">
                          부여된 권한이 없습니다.
                        </span>
                      )}
                  </div>
                </SectionCard.Content>
              </SectionCard>
            </div>
          )}
          {activeTab === 'terms' && <ProfileTermsTab agreements={agreements} />}
        </div>
      </PageSection.Content>
    </PageSection>
  );
}
