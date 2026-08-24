import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Activity, CheckCircle2, Clock, Coffee, FileText, HelpCircle, KeyRound, LayoutDashboard, type LucideIcon, Megaphone, MessageCircleQuestion, MessageSquareQuote, Settings2, ShieldCheck, UserRound, Users, Wrench } from 'lucide-react';
import { useState } from 'react';

import { useAuthControllerDeferPasswordChange } from '#/.generated/api/endpoints/auth/auth';
import { useSystemConfigControllerGetSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { NoticeBanner } from '#/components/app';
import { hasPermission, type PermissionName } from '#/core/auth/permissions';
import { PasswordChangeModal } from '#/routes/_protected/_app/profile/-components/modals/PasswordChangeModal';

function getStatusStyle(code: string) {
  switch (code) {
    case 'OPEN':
      return {
        iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        badgeVariant: 'default' as const,
        label: '정상 운영 중',
      };
    case 'LUNCH_BREAK':
      return {
        iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        badgeVariant: 'secondary' as const,
        label: '점심 시간',
      };
    case 'MAINTENANCE':
      return {
        iconClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        badgeVariant: 'destructive' as const,
        label: '시스템 점검',
      };
    case 'HOLIDAY':
      return {
        iconClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
        badgeVariant: 'secondary' as const,
        label: '공휴일 휴무',
      };
    case 'WEEKEND':
      return {
        iconClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
        badgeVariant: 'secondary' as const,
        label: '주말 휴무',
      };
    default:
      return {
        iconClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
        badgeVariant: 'secondary' as const,
        label: '운영 마감',
      };
  }
}

export const Route = createFileRoute('/_protected/_app/dashboard/')({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const context = Route.useRouteContext();
  const { t } = useI18n();
  const [user, setUser] = useState(context.user);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const configQuery = useSystemConfigControllerGetSystemConfig();
  const deferPasswordMutation = useAuthControllerDeferPasswordChange();

  const handleDeferPasswordChange = async () => {
    try {
      await deferPasswordMutation.mutateAsync();
      setUser((prev) => ({ ...prev, isPasswordChangeRequired: false }));
    }
    catch {
      return;
    }
  };

  const handlePasswordChanged = () => {
    setUser((prev) => ({
      ...prev,
      isPasswordChangeRequired: false,
      passwordUpdatedAt: new Date().toISOString(),
    }));
  };

  const operatingStatus = configQuery.data?.operatingStatus;

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
      href: '/notice',
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
      href: '/inquiry',
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
      href: '/notice-management',
      description: t('dashboard.noticeManagementDescription'),
      icon: Megaphone,
      color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-400',
      permission: 'notice:manage',
    },
    {
      title: t('dashboard.faqManagement'),
      href: '/faq-management',
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
    {
      title: t('dashboard.systemConfig'),
      href: '/system-config',
      description: t('dashboard.systemConfigDescription'),
      icon: Settings2,
      color: 'text-slate-600 bg-slate-100 dark:bg-slate-900 dark:text-slate-400',
      permission: 'system:manage',
    },
  ];

  const visibleOperationsItems = operationsMenuItems.filter(
    (item) => hasPermission(user?.permissions, item.permission),
  );

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
      overflow-hidden pt-6 pl-6 pr-0 pb-0
    "
    >
      {/* Row 1 (auto): Standard Page Header */}
      <div className="
        flex flex-col gap-4 pr-6
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
      <main className="scroll-y space-y-6 pr-6 pb-6">

        {/* 1. 🚨 긴급/중요 공지사항 배너 (공지사항 게시판 긴급/중요 공지 최우선 노출) */}
        <NoticeBanner />

        {/* 2. 🔑 비밀번호 변경 주기 알림 카드 (보안 조치 필요 시 최우선 노출) */}
        {user?.isPasswordChangeRequired
          ? (
            <div className="
              flex flex-col
              sm:flex-row sm:items-center
              justify-between gap-4 rounded-xl border border-amber-500/30
              bg-amber-500/5 p-4 shadow-xs
            "
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="
                  flex size-10 shrink-0 items-center justify-center rounded-lg
                  bg-amber-500/10 text-amber-600
                  dark:text-amber-400
                "
                >
                  <KeyRound className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">비밀번호 변경 주기 알림</span>
                    <Badge
                      variant="secondary"
                      className="
                        text-[11px] font-semibold text-amber-700 bg-amber-100
                        dark:bg-amber-950 dark:text-amber-300
                      "
                    >
                      변경 권장
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    계정 보안을 위해 90일 주기 비밀번호 변경을 권장합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDeferPasswordChange()}
                  className="text-xs h-8"
                >
                  다음에 변경
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowPasswordChangeModal(true)}
                  className="text-xs h-8 gap-1.5"
                >
                  <ShieldCheck className="size-3.5" />
                  지금 변경
                </Button>
              </div>
            </div>
          )
          : null}

        {/* 4. 🕒 고객센터 운영 현황 카드 */}
        {operatingStatus && (
          <div className="
            flex flex-col
            sm:flex-row sm:items-center
            justify-between gap-4 rounded-xl border bg-card/60 backdrop-blur-xs
            p-4 shadow-xs
          "
          >
            {(() => {
              const style = getStatusStyle(operatingStatus.code);
              return (
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`
                    flex size-10 shrink-0 items-center justify-center rounded-lg
                    ${style.iconClass}
                  `}
                  >
                    {operatingStatus.code === 'OPEN' && (
                      <CheckCircle2 className="size-5" />
                    )}
                    {operatingStatus.code === 'LUNCH_BREAK' && (
                      <Coffee className="size-5" />
                    )}
                    {operatingStatus.code === 'MAINTENANCE' && (
                      <Wrench className="size-5" />
                    )}
                    {(operatingStatus.code === 'CLOSED' || operatingStatus.code === 'HOLIDAY' || operatingStatus.code === 'WEEKEND') && (
                      <Clock className="size-5" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">고객센터 운영 현황</span>
                      <Badge
                        variant={style.badgeVariant}
                        className="text-[11px] font-semibold uppercase"
                      >
                        {style.label}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {operatingStatus.message || '실시간 1:1 상담 및 문의 접수가 가능합니다.'}
                    </p>
                  </div>
                </div>
              );
            })()}

            {hasPermission(user?.permissions, 'system:manage') && (
              <Button
                variant="ghost"
                size="sm"
                render={<Link to="/system-config" />}
                className="gap-1.5 shrink-0 text-xs font-medium"
              >
                <Settings2 className="size-3.5" />
                운영 설정 관리
              </Button>
            )}
          </div>
        )}

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
                    h-full transition-all duration-200
                    hover:-translate-y-0.5 hover:border-primary/40
                    hover:shadow-md
                  "
                  >
                    <CardHeader className="space-y-2">
                      <div
                        className={`
                          flex size-10 items-center justify-center rounded-lg
                          ${item.color}
                          transition-transform
                          group-hover:scale-105
                        `}
                      >
                        <ItemIcon className="size-5" />
                      </div>
                      <CardTitle className="
                        text-sm font-bold text-foreground
                        group-hover:text-primary
                        transition-colors
                      "
                      >
                        {item.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
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
                      h-full transition-all duration-200
                      hover:-translate-y-0.5 hover:border-primary/40
                      hover:shadow-md
                    "
                    >
                      <CardHeader className="space-y-2">
                        <div
                          className={`
                            flex size-10 items-center justify-center rounded-lg
                            ${item.color}
                            transition-transform
                            group-hover:scale-105
                          `}
                        >
                          <ItemIcon className="size-5" />
                        </div>
                        <CardTitle className="
                          text-sm font-bold text-foreground
                          group-hover:text-primary
                          transition-colors
                        "
                        >
                          {item.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Password Change Modal */}
      <PasswordChangeModal
        user={user}
        open={showPasswordChangeModal}
        onOpenChange={setShowPasswordChangeModal}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  );
}
