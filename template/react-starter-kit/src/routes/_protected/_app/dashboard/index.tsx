import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { cn } from '#/.generated/shadcn/lib/utils';
import { LinkCard, PageSection } from '#/components/layout';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { NoticeBanner } from './-components/notice-banner';
import { OperatingStatusCard } from './-components/operating-status-card';
import { PasswordChangeReminderCard } from './-components/password-change-reminder-card';
import { DASHBOARD_MENU_ITEMS } from './-configs/dashboard-menu.config';

export const Route = createFileRoute('/_protected/_app/dashboard/')({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const { user, systemConfig } = Route.useRouteContext();
  const { t } = useI18n();

  const operatingStatus = systemConfig?.operatingStatus;

  const serviceMenuItems = DASHBOARD_MENU_ITEMS.filter((item) => !item.permission);
  const operationsMenuItems = DASHBOARD_MENU_ITEMS.filter((item) =>
    hasPermission(user.permissions, item.permission),
  );

  return (
    <PageSection
      icon="layout-dashboard"
      title={t('dashboard.welcome', { name: user?.name || t('profile.userFallback') })}
      description={t('dashboard.consoleDescription')}
    >
      <PageSection.Content className={
        cn(
          'grid grid-rows-[auto_1fr]',
          '*:p-4',
        )
      }
      >
        {/* 알림 영역 */}
        <div>
          {/* 긴급/중요 공지사항 */}
          <ClientOnly fallback={null}>
            <NoticeBanner />
          </ClientOnly>

          {/* 비밀번호 변경 알림 */}
          <ClientOnly fallback={null}>
            <PasswordChangeReminderCard user={user} />
          </ClientOnly>

          {/* 고객센터 운영 현황 */}
          <ClientOnly fallback={null}>
            {operatingStatus && (
              <OperatingStatusCard
                operatingStatus={operatingStatus}
                canManage={hasPermission(user.permissions, 'system:manage')}
              />
            )}
          </ClientOnly>
        </div>

        {/* 메뉴 영역 */}
        <div className="
          scroll-y
          *:pb-4
        "
        >
          {serviceMenuItems.length > 0 && (
            <section>
              <div>
                <h2 className="
                  text-base font-bold tracking-tight text-foreground
                "
                >
                  {t('dashboard.serviceMenus')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('dashboard.serviceMenusDescription')}</p>
              </div>
              <div className="flex flex-wrap">
                {serviceMenuItems.map((item) => (
                  <div
                    key={item.href}
                    className="w-60 h-30"
                  >
                    <LinkCard
                      to={item.href}
                      icon={item.icon}
                      iconColor={item.iconColor}
                      title={t(item.titleKey)}
                      description={t(item.descriptionKey)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {operationsMenuItems.length > 0 && (
            <section>
              <div>
                <h2 className="
                  text-base font-bold tracking-tight text-foreground
                "
                >
                  {t('dashboard.managementMenus')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('dashboard.managementMenusDescription')}</p>
              </div>
              <div className="flex flex-wrap">
                {operationsMenuItems.map((item) => (
                  <div
                    key={item.href}
                    className="w-60 h-30"
                  >
                    <LinkCard
                      to={item.href}
                      icon={item.icon}
                      iconColor={item.iconColor}
                      title={t(item.titleKey)}
                      description={t(item.descriptionKey)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </PageSection.Content>
    </PageSection>
  );
}
