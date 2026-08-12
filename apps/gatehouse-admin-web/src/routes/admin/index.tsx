import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { ArrowUpRight, CheckCircle2, FileText, KeyRound, ShieldAlert, ShieldCheck, UserCheck, Users, Zap } from 'lucide-react';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { AdminFrame } from '#/components/layout';
import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

export const Route = createFileRoute('/admin/')({
  beforeLoad: ({ context }) => {
    const profile = context.authSession?.user;
    if (!profile) throw redirect({ to: '/login' });
    if (profile.role !== 'admin' && profile.role !== 'super-admin') {
      throw redirect({ to: '/' });
    }
    return { profile, expiresAt: context.authSession?.expiresAt ?? null };
  },
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { profile, expiresAt } = Route.useRouteContext();

  const overviewStats = [
    {
      title: '전체 서비스 회원',
      value: '1,284명',
      description: '전월 대비 +12.5% 증가',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: '활성 회원',
      value: '1,240명',
      description: '정상 이용 중인 계정',
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: '계정 정지 회원',
      value: '44명',
      description: '보안 및 약관 위반 제제',
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
    },
    {
      title: '오늘 신규 가입',
      value: '18명',
      description: '실시간 가입 모니터링',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  const menuSections = [
    {
      groupTitle: '서비스 회원 관리',
      groupDescription: '일반 서비스 이용자 계정, 상태 제어 및 약관 동의 이력',
      items: [
        {
          title: '서비스 회원 관리',
          href: '/admin/users',
          description: '전체 서비스 회원 조회, 정지/복구 상태 변경 및 2단계 인증 정보 관리',
          icon: Users,
          badge: 'Live',
        },
        {
          title: '서비스 약관 관리',
          href: '/admin/terms',
          description: '이용약관 및 개인정보 처리방침 개정 이력 관리',
          icon: FileText,
          badge: 'v2.4',
        },
      ],
    },
    {
      groupTitle: '관리자 시스템 관리',
      groupDescription: '관리자 계정 생성, 권한 할당 및 역할 기반 접근 제어(RBAC)',
      items: [
        {
          title: '관리자 계정 관리',
          href: '/admin/system-users',
          description: '시스템 관리자 계정 생성, 권한 승인 및 역할 부여',
          icon: ShieldCheck,
          badge: 'Admin',
        },
        {
          title: '관리자 약관 관리',
          href: '/admin/system-terms',
          description: '관리자 전용 보안 서약서 및 운영 약관 개정',
          icon: FileText,
        },
        {
          title: '관리자 접근 제어 (Permissions)',
          href: '/admin/permissions',
          description: '역할(Role)별 리소스 접근 권한(Create, Read, Update, Delete) 매핑',
          icon: KeyRound,
          badge: 'RBAC',
        },
      ],
    },
  ];

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <AdminFrame user={profile} title="대시보드">
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="
            relative overflow-hidden rounded-2xl border border-primary/20
            bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6
            shadow-xs
            sm:p-8
          "
          >
            <div className="
              flex flex-col items-start justify-between gap-4
              md:flex-row md:items-center
            "
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {profile.role.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    접속 계정:
                    {' '}
                    {profile.email}
                  </span>
                </div>
                <h1 className="
                  text-2xl font-black tracking-tight text-foreground
                  sm:text-3xl
                "
                >
                  안녕하세요,
                  {' '}
                  {profile.name}
                  님! 👋
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gatehouse 통합 관리자 대시보드에 오신 것을 환영합니다. 시스템 현황을 한눈에 파악하고 메뉴로 이동하세요.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" asChild>
                  <Link
                    to="/admin/users"
                    className="flex items-center gap-2 font-semibold"
                  >
                    <span>회원 관리 바로가기</span>
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Overview KPI Grid */}
          <div>
            <h2 className="
              mb-4 text-base font-bold tracking-tight text-foreground
            "
            >
              시스템 현황 요약
            </h2>
            <div className="
              grid gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
            >
              {overviewStats.map((stat, idx) => {
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

          {/* Main Navigation Menu Sections */}
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div>
                <h2 className="
                  text-base font-bold tracking-tight text-foreground
                "
                >
                  {section.groupTitle}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {section.groupDescription}
                </p>
              </div>

              <div className="
                grid gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
              >
                {section.items.map((item, itemIdx) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link key={itemIdx} to={item.href} className="group">
                      <Card className="
                        h-full transition-all duration-200
                        group-hover:-translate-y-1 group-hover:border-primary/40
                        group-hover:shadow-md
                      "
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="
                              flex size-10 items-center justify-center
                              rounded-xl bg-primary/10 text-primary
                              transition-colors
                              group-hover:bg-primary
                              group-hover:text-primary-foreground
                            "
                            >
                              <ItemIcon className="size-5" />
                            </div>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-semibold"
                              >
                                {item.badge}
                              </Badge>
                            )}
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
                          <div className="
                            mt-4 flex items-center gap-1 text-xs font-semibold
                            text-primary opacity-0 transition-opacity
                            group-hover:opacity-100
                          "
                          >
                            <span>메뉴 이동하기</span>
                            <ArrowUpRight className="size-3.5" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Security & System Info Footer Banner */}
          <Card className="bg-card">
            <CardContent className="
              flex flex-col items-center justify-between gap-4 p-6
              sm:flex-row
            "
            >
              <div className="flex items-center gap-3">
                <div className="
                  flex size-10 shrink-0 items-center justify-center rounded-full
                  bg-emerald-100 text-emerald-600
                  dark:bg-emerald-950/60 dark:text-emerald-400
                "
                >
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">시스템 모든 서비스 정상 작동 중</h4>
                  <p className="text-xs text-muted-foreground">인증 세션 정책 및 RBAC 가드가 동적으로 적용되어 있습니다.</p>
                </div>
              </div>
              <div className="
                flex items-center gap-2 text-xs font-mono text-muted-foreground
              "
              >
                <span>API Gateway: Online</span>
                <span>•</span>
                <span>Role Guard: Enforced</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminFrame>
    </SessionActivityGuard>
  );
}
