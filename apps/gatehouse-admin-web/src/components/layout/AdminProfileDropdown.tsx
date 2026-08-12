import { useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { Avatar, AvatarFallback, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';

export interface AdminUserProfile {
  name: string
  email?: string
  role?: string
  avatarUrl?: string
}

interface AdminProfileDropdownProps {
  user?: AdminUserProfile
}

export function AdminProfileDropdown({ user }: AdminProfileDropdownProps) {
  const navigate = useNavigate();
  const logoutMutation = useAuthControllerLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = user?.name || '관리자';
  const userEmail = user?.email || 'admin@gatehouse.io';

  let roleLabel = '운영자';
  if (user?.role === 'super-admin') {
    roleLabel = '최고 관리자';
  }
  else if (user?.role === 'admin') {
    roleLabel = '관리자';
  }

  const initials = userName.substring(0, 2).toUpperCase();

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutMutation.mutateAsync();
      toast.success('성공적으로 로그아웃되었습니다.');
      await navigate({ to: '/login', replace: true });
    }
    catch {
      toast.error('로그아웃 처리 중 오류가 발생했습니다.');
    }
    finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            className="
              relative flex h-10 items-center gap-2.5 rounded-full pl-2 pr-3
              transition-colors
              hover:bg-accent/60
            "
            aria-label="프로필 메뉴 열기"
          >
            <Avatar
              size="sm"
              className="
                size-8 ring-2 ring-primary/20 transition-transform
                group-hover:scale-105
              "
            >
              <AvatarFallback className="
                bg-primary/10 text-xs font-semibold text-primary
              "
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="
              hidden text-left
              sm:block
            "
            >
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-semibold">{userName}</span>
                <Badge
                  variant={user?.role === 'super-admin' ? 'default' : 'secondary'}
                  className="px-1 py-0 text-[10px] font-normal"
                >
                  {roleLabel}
                </Badge>
              </div>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{userEmail}</span>
            </div>
          </Button>
        )}
      />

      <DropdownMenuContent
        align="end"
        className="w-56 p-2 shadow-xl ring-1 ring-black/5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-2 font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="
                  text-sm font-semibold leading-none text-foreground
                "
                >
                  {userName}
                </p>
                <Badge
                  variant={user?.role === 'super-admin' ? 'default' : 'outline'}
                  className="text-[10px]"
                >
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => void navigate({ to: '/profile' })}
            className="cursor-pointer py-2 text-xs"
          >
            <User className="mr-2 size-4 text-muted-foreground" />
            <span>내 프로필</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          variant="destructive"
          className="cursor-pointer py-2 text-xs font-medium"
        >
          <LogOut className="mr-2 size-4" />
          <span>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
