import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { LocaleSwitcher } from '#/components/app/locale-switcher';
import { useAuth } from '#/core/auth/useAuth';

export function DashboardHeader() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    void navigate({ to: '/login' });
  };

  return (
    <header className="
      mb-8 flex flex-col gap-4
      sm:flex-row sm:items-center sm:justify-between
    "
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">사용자 대시보드</h1>
          <Badge variant="secondary" className="shrink-0">보안 인증</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          계정 보안, 2단계 인증, 약관 동의 및 세션 관리 콘솔
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <LocaleSwitcher />
        <Button variant="outline" onClick={() => void handleLogout()}>
          <LogOut className="size-4" />
          <span>로그아웃</span>
        </Button>
      </div>
    </header>
  );
}
