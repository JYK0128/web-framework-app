import { AppIcon } from '@pkg/web-core/application';
import { useI18n } from '@pkg/web-core/context/i18n';
import { LinkCard, PageSection, SectionCard } from '@pkg/web-core/template';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/_app/')({ component: AdminDashboard });

const dashboardLinks = [
  { title: 'admin.navigation.customers', description: 'admin.dashboard.customersDescription', to: '/customers', icon: 'users', permission: 'customer:read', color: 'text-indigo-600 dark:text-indigo-400' },
  { title: 'admin.navigation.qna', description: 'admin.dashboard.qnaDescription', to: '/qna', icon: 'message-circle-question', permission: 'qna:read', color: 'text-cyan-600 dark:text-cyan-400' },
  { title: 'admin.navigation.support', description: 'admin.dashboard.supportDescription', to: '/support', icon: 'messages-square', permission: 'support:read', color: 'text-sky-600 dark:text-sky-400' },
  { title: 'admin.navigation.notices', description: 'admin.dashboard.noticesDescription', to: '/notices', icon: 'megaphone', permission: 'notice:read', color: 'text-rose-600 dark:text-rose-400' },
  { title: 'admin.navigation.faqs', description: 'admin.dashboard.faqsDescription', to: '/faqs', icon: 'circle-help', permission: 'faq:read', color: 'text-teal-600 dark:text-teal-400' },
  { title: 'admin.navigation.serviceSettings', description: 'admin.dashboard.settingsDescription', to: '/service-settings', icon: 'settings-2', permission: 'system:read', color: 'text-violet-600 dark:text-violet-400' },
  { title: 'admin.navigation.profile', description: 'admin.dashboard.profileDescription', to: '/profile', icon: 'user-round', permission: undefined, color: 'text-emerald-600 dark:text-emerald-400' },
] as const;

function AdminDashboard() {
  const { user } = Route.useRouteContext();
  const { t } = useI18n();
  const links = dashboardLinks.filter((item) => !item.permission || user.permissions.includes(item.permission));

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="layout-dashboard" title={t('admin.dashboard.title')} description={t('admin.dashboard.description')}>
        <PageSection.Content className="
          mx-auto grid size-full w-full max-w-6xl content-start gap-6 pt-2
        "
        >
          <SectionCard>
            <SectionCard.Content className="grid gap-2 p-6">
              <h2 className="text-lg font-semibold">{t('admin.dashboard.welcome')}</h2>
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.quickAccessDescription')}</p>
            </SectionCard.Content>
          </SectionCard>
          <section className="grid content-start gap-3">
            <h2 className="text-base font-semibold">{t('admin.dashboard.quickAccess')}</h2>
            <div className="
              grid gap-4
              sm:grid-cols-2
              xl:grid-cols-3
            "
            >
              {links.map((item) => (
                <LinkCard
                  key={item.to}
                  to={item.to}
                  title={t(item.title)}
                  description={t(item.description)}
                  icon={(
                    <AppIcon
                      name={item.icon}
                      className="size-5"
                    />
                  )}
                  iconColor={item.color}
                />
              ))}
            </div>
          </section>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
