import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Activity, FileText, HelpCircle, KeyRound, LayoutDashboard, type LucideIcon, Megaphone, MessageCircleQuestion, MessageSquareQuote, UserRound, Users } from 'lucide-react';

import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { NoticeBanner } from '#/components/app';
import { hasPermission, type PermissionName } from '#/core/auth/permissions';

export const Route = createFileRoute('/_protected/_app/dashboard/')({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const context = Route.useRouteContext();
  const { t } = useI18n();
  const { user } = context;

  const serviceMenuItems: Array<{
    title: string
    href: string
    description: string
    icon: LucideIcon
    color: string
    permission?: PermissionName
  }> = [
    {
      title: t('dashboard.announcements'),
      href: '/announcements',
      description: t('dashboard.announcementsDescription'),
      icon: Megaphone,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      title: t('dashboard.faq'),
      href: '/faq',
      description: t('dashboard.faqDescription'),
      icon: HelpCircle,
      color: 'text-teal-600 bg-teal-100 dark:bg-teal-950 dark:text-teal-400',
    },
    {
      title: t('dashboard.inquiries'),
      href: '/inquiries',
      description: t('dashboard.inquiriesDescription'),
      icon: MessageCircleQuestion,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400',
    },
    {
      title: t('dashboard.profileAndSessions'),
      href: '/profile',
      description: t('dashboard.profileAndSessionsDescription'),
      icon: UserRound,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400',
    },
  ];

  const operationsMenuItems: Array<{
    title: string
    href: string
    description: string
    icon: LucideIcon
    color: string
    permission: PermissionName
  }> = [
    {
      title: t('dashboard.userManagement'),
      href: '/users',
      description: t('dashboard.userManagementDescription'),
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
      permission: 'user:manage',
    },
    {
      title: t('dashboard.permissionManagement'),
      href: '/permission',
      description: t('dashboard.permissionManagementDescription'),
      icon: KeyRound,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400',
      permission: 'role:manage',
    },
    {
      title: t('dashboard.noticeManagement'),
      href: '/notices',
      description: t('dashboard.noticeManagementDescription'),
      icon: Megaphone,
      color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-400',
      permission: 'notice:manage',
    },
    {
      title: t('dashboard.faqManagement'),
      href: '/faqs',
      description: t('dashboard.faqManagementDescription'),
      icon: MessageSquareQuote,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400',
      permission: 'faq:manage',
    },
    {
      title: t('dashboard.inquiryManagement'),
      href: '/inquiry-management',
      description: t('dashboard.inquiryManagementDescription'),
      icon: MessageCircleQuestion,
      color: 'text-pink-600 bg-pink-100 dark:bg-pink-950 dark:text-pink-400',
      permission: 'inquiry:manage',
    },
    {
      title: t('dashboard.termsManagement'),
      href: '/terms',
      description: t('dashboard.termsManagementDescription'),
      icon: FileText,
      color: 'text-violet-600 bg-violet-100 dark:bg-violet-950 dark:text-violet-400',
      permission: 'term:manage',
    },
    {
      title: t('dashboard.activityLogs'),
      href: '/activity-logs',
      description: t('dashboard.activityLogsDescription'),
      icon: Activity,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-400',
      permission: 'activityLog:manage',
    },

  ];

  const visibleOperationsItems = operationsMenuItems.filter(
    (item) => hasPermission(user?.permissions, item.permission),
  );

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      {/* Row 1 (auto): Standard Page Header */}
      <div className="
        flex flex-col gap-4
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="
              flex size-9 items-center justify-center rounded-lg bg-primary/10
              text-primary shadow-xs
            "
            >
              <LayoutDashboard className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('dashboard.welcome', { name: user?.name || t('profile.userFallback') })}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.consoleDescription')}
          </p>
        </div>
      </div>

      {/* Row 2 (1fr): Main Scrollable Content */}
      <main className="scroll-y space-y-6 pr-1">
        <NoticeBanner />

        {/* Service Shortcuts (For All Users) */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {t('dashboard.serviceMenus')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.serviceMenusDescription')}
            </p>
          </div>

          <div className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
          "
          >
            {serviceMenuItems.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <Link key={idx} to={item.href} className="group block">
                  <Card className="
                    h-full p-5 transition-all duration-200
                    hover:-translate-y-0.5 hover:border-primary/40
                    hover:shadow-md
                  "
                  >
                    <CardContent className="flex flex-col gap-3 p-0">
                      <div className="flex items-center justify-between">
                        <div className={`
                          flex size-10 items-center justify-center rounded-xl
                          ${item.color}
                          transition-transform
                          group-hover:scale-105
                        `}
                        >
                          <ItemIcon className="size-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="
                          text-sm font-bold text-foreground
                          group-hover:text-primary
                        "
                        >
                          {item.title}
                        </h3>
                        <p className="
                          mt-1 line-clamp-2 text-xs text-muted-foreground
                        "
                        >
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Operations & Management Menu Cards (Admin Only) */}
        {visibleOperationsItems.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {t('dashboard.managementMenus')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.managementMenusDescription')}
              </p>
            </div>

            <div className="
              grid grid-cols-1 gap-4
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
            "
            >
              {visibleOperationsItems.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <Link key={idx} to={item.href} className="group block">
                    <Card className="
                      h-full p-5 transition-all duration-200
                      hover:-translate-y-0.5 hover:border-primary/40
                      hover:shadow-md
                    "
                    >
                      <CardContent className="flex flex-col gap-3 p-0">
                        <div className="flex items-center justify-between">
                          <div className={`
                            flex size-10 items-center justify-center rounded-xl
                            ${item.color}
                            transition-transform
                            group-hover:scale-105
                          `}
                          >
                            <ItemIcon className="size-5" />
                          </div>
                        </div>
                        <div>
                          <h3 className="
                            text-sm font-bold text-foreground
                            group-hover:text-primary
                          "
                          >
                            {item.title}
                          </h3>
                          <p className="
                            mt-1 line-clamp-2 text-xs text-muted-foreground
                          "
                          >
                            {item.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
