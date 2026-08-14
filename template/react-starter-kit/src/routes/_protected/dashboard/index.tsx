import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link } from '@tanstack/react-router';
import { KeyRound, type LucideIcon, ShieldCheck, UserCheck, Users, UserX } from 'lucide-react';

import { useUsersControllerGetUsers } from '#/.generated/api/endpoints/users/users';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { hasPermission, type PermissionName } from '#/core/auth/permissions';

export const Route = createFileRoute('/_protected/dashboard/')({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const context = Route.useRouteContext();
  const { t } = useI18n();
  const { user } = context;
  const canReadUsers = hasPermission(user?.permissions, 'user:read');
  const { data } = useUsersControllerGetUsers(
    { limit: 50 },
    { query: { enabled: canReadUsers } },
  );

  const users = data?.items ?? [];
  const totalUsers = data?.totalCount ?? users.length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'super-admin').length;
  const twoFactorCount = users.filter((u) => u.twoFactorEnabled).length;

  const stats = [
    {
      title: t('dashboard.totalUsers'),
      value: t('dashboard.count', { count: totalUsers }),
      description: t('dashboard.totalUsersDescription'),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: t('dashboard.adminAccounts'),
      value: t('dashboard.count', { count: adminCount }),
      description: t('dashboard.adminAccountsDescription'),
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: t('dashboard.twoFactorEnabled'),
      value: t('dashboard.count', { count: twoFactorCount }),
      description: t('dashboard.twoFactorEnabledDescription'),
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: t('dashboard.regularUsers'),
      value: t('dashboard.count', { count: Math.max(0, totalUsers - adminCount) }),
      description: t('dashboard.regularUsersDescription'),
      icon: UserX,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
    },
  ];

  const menuItems = [
    {
      title: t('dashboard.userManagement'),
      href: '/users',
      description: t('dashboard.userManagementDescription'),
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
      permission: 'user:read',
    },
    {
      title: t('dashboard.permissionManagement'),
      href: '/permission',
      description: t('dashboard.permissionManagementDescription'),
      icon: KeyRound,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400',
      permission: 'role:read',
    },
    {
      title: t('dashboard.profileAndSessions'),
      href: '/profile',
      description: t('dashboard.profileAndSessionsDescription'),
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400',
      permission: undefined,
    },
  ] as const satisfies readonly {
    title: string
    href: string
    description: string
    icon: LucideIcon
    color: string
    permission?: PermissionName
  }[];
  const visibleMenuItems = menuItems.filter(
    (item) => item.permission === undefined || hasPermission(user?.permissions, item.permission),
  );

  return (
    <div className="
      mx-auto grid size-full max-w-7xl content-start gap-6 scroll-y p-6
    "
    >
      {/* Welcome Hero Banner */}
      <div className="
        relative overflow-hidden rounded-2xl border border-primary/20
        bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6
        shadow-xs
        sm:p-8
      "
      >
        <div className="
          grid items-start gap-4
          md:flex md:items-center md:justify-between
        "
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {user?.role ? user.role.toUpperCase() : t('profileMenu.roleFallback')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
            <h1 className="
              text-2xl font-black tracking-tight text-foreground
              sm:text-3xl
            "
            >
              {t('dashboard.welcome', { name: user?.name || t('profile.userFallback') })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.consoleDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {canReadUsers && (
        <div>
          <h2 className="
            mb-4 text-base font-bold tracking-tight text-foreground
          "
          >
            {t('dashboard.systemSummary')}
          </h2>
          <div className="
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
          >
            {stats.map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={idx}
                  className="
                    transition-all
                    hover:shadow-md
                  "
                >
                  <CardHeader className="
                    flex flex-row items-center justify-between pb-2
                  "
                  >
                    <CardTitle className="
                      text-xs font-semibold text-muted-foreground
                    "
                    >
                      {stat.title}
                    </CardTitle>
                    <div className={`
                      flex size-9 items-center justify-center rounded-xl
                      ${stat.color}
                    `}
                    >
                      <IconComponent className="size-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="
                      text-2xl font-extrabold tracking-tight text-foreground
                    "
                    >
                      {stat.value}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Navigation Menu Cards */}
      <div>
        <h2 className="mb-1 text-base font-bold tracking-tight text-foreground">
          {t('dashboard.managementMenus')}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('dashboard.managementMenusDescription')}
        </p>

        <div className="
          grid gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        "
        >
          {visibleMenuItems.map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <Link key={idx} to={item.href} className="group">
                <Card className="
                  h-full transition-all duration-200
                  group-hover:-translate-y-1 group-hover:border-primary/40
                  group-hover:shadow-md
                "
                >
                  <CardHeader className="pb-3">
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
                    <CardTitle className="
                      mt-3 text-base font-bold text-foreground
                      group-hover:text-primary
                    "
                    >
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs/relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
