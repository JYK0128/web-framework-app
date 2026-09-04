import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { Avatar, AvatarFallback, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

export interface ProfileDropdownUser {
  name?: string
  email?: string
  role?: string | null
}

interface ProfileDropdownProps {
  user?: ProfileDropdownUser
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogout();
  const { t } = useI18n();

  const userName = user?.name || t('app.profileMenu.userFallback');
  const userEmail = user?.email || t('app.profileMenu.emailFallback');
  const roleLabel = user?.role ? user.role.toUpperCase() : t('app.profileMenu.roleFallback');
  const initials = userName.substring(0, 2).toUpperCase();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // 에러 발생 시에도 클라이언트 캐시 정리 및 이동을 보장
    }
    finally {
      queryClient.setQueryData(getAuthControllerUserProfileQueryKey(), null);
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
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
            aria-label={t('app.profileMenu.open')}
          >
            <Avatar
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
              md:block
            "
            >
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-semibold">{userName}</span>
                <Badge
                  variant="secondary"
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
                <Badge variant="outline" className="text-[10px]">
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
            <span>{t('app.profileMenu.profile')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={logoutMutation.isPending}
          onClick={() => void handleLogout()}
          variant="destructive"
          className="cursor-pointer py-2 text-xs font-medium"
        >
          <LogOut className="mr-2 size-4" />
          <span>{logoutMutation.isPending ? t('app.profileMenu.loggingOut') : t('app.profileMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
