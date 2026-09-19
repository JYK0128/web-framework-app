import { DateUtil } from '@pkg/shared/common';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import type { MeResponse, TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';

import { ProfileTermsTab } from './profile-terms-tab';

export const Route = createFileRoute('/_protected/profile')({ component: ProfilePage });

function ProfilePage() {
  const { user, agreements }: { user: MeResponse, agreements: TermAgreementItemDto[] } = Route.useRouteContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'terms'>('overview');
  return (
    <div className="size-full scroll-y p-6">
      <PageSection icon="user" title="내 프로필" description="현재 로그인한 관리자 계정과 권한 정보입니다.">
        <PageSection.Content className="grid max-w-5xl gap-4 pt-2">
          <div className="flex gap-1 border-b">
            <Button
              variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('overview')}
            >
              계정 정보
            </Button>
            <Button
              variant={activeTab === 'terms' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('terms')}
            >
              약관
            </Button>
          </div>
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
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
