import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, CheckCircle2, KeyRound, ShieldCheck, UserCheck, Users, UserX, Zap } from 'lucide-react';

import { useUsersControllerGetUsers } from '#/.generated/api/endpoints/users/users';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/')({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const context = Route.useRouteContext();
  const user = context.user as { name?: string, email?: string, role?: string } | undefined;
  const { data } = useUsersControllerGetUsers({ limit: 50 });

  const users = data?.items ?? [];
  const totalUsers = data?.totalCount ?? users.length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'super-admin').length;
  const twoFactorCount = users.filter((u) => u.twoFactorEnabled).length;

  const stats = [
    {
      title: '전체 사용자 수',
      value: `${totalUsers}명`,
      description: '등록된 전체 계정',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: '관리자 계정',
      value: `${adminCount}명`,
      description: '관리자 권한 보유 계정',
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: '2FA 보안 활성화',
      value: `${twoFactorCount}명`,
      description: '2단계 인증 적용 계정',
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: '일반 회원',
      value: `${Math.max(0, totalUsers - adminCount)}명`,
      description: '서비스 일반 사용자',
      icon: UserX,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
    },
  ];

  const menuItems = [
    {
      title: '회원 관리 (Users)',
      href: '/users',
      description: '전체 사용자 목록 조회, 검색 및 2단계 인증/역할 상태 확인',
      icon: Users,
      badge: 'DataGrid',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      title: '권한 & 접근 제어 (Permissions)',
      href: '/permission',
      description: '역할(Role)별 Term/Role CRUD 권한 설정 및 토글 제어',
      icon: KeyRound,
      badge: 'RBAC',
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400',
    },
    {
      title: '내 프로필 & 세션 (Profile)',
      href: '/profile',
      description: '계정 정보 관리, 2FA 설정 및 활성 세션 모니터링',
      icon: ShieldCheck,
      badge: 'Security',
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400',
    },
  ];

  return (
    <div className="
      mx-auto max-w-6xl space-y-8 p-4
      sm:p-6
      lg:p-8
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
          flex flex-col items-start justify-between gap-4
          md:flex-row md:items-center
        "
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {user?.role ? user.role.toUpperCase() : 'USER'}
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
              반갑습니다,
              {' '}
              {user?.name || '사용자'}
              님! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              스타터 킷 관리 콘솔입니다. 원하시는 관리 메뉴를 선택하여 이동하세요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" asChild>
              <Link
                to="/users"
                className="flex items-center gap-2 font-semibold"
              >
                <span>회원 관리 바로가기</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div>
        <h2 className="mb-4 text-base font-bold tracking-tight text-foreground">
          시스템 현황 요약
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

      {/* Main Navigation Menu Cards */}
      <div>
        <h2 className="mb-1 text-base font-bold tracking-tight text-foreground">
          주요 관리 메뉴
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          원하시는 관리 기능 메뉴 카드를 선택하여 해당 페이지로 이동합니다.
        </p>

        <div className="
          grid gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        "
        >
          {menuItems.map((item, idx) => {
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
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold"
                      >
                        {item.badge}
                      </Badge>
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

      {/* Status Footer */}
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
              <h4 className="text-sm font-bold text-foreground">시스템 서비스 및 API 연결 상태 정상</h4>
              <p className="text-xs text-muted-foreground">페이지네이션, DTO 표준화 및 권한 제어 엔진이 활성화되어 있습니다.</p>
            </div>
          </div>
          <div className="
            flex items-center gap-2 text-xs font-mono text-muted-foreground
          "
          >
            <Zap className="size-3.5 text-amber-500" />
            <span>Standard API Architecture</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
