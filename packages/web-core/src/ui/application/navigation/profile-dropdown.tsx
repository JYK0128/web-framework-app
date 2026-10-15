import { LogOut, User } from 'lucide-react';

import { useI18n } from '#context/i18n';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '#ui';

export type ProfileDropdownUser = {
  name?: string | null
  email?: string | null
  roleLabel?: string | null
};

export type ProfileDropdownProps = {
  user: ProfileDropdownUser
  logoutPending?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onProfile: () => void
  onLogout: () => void
};

export function ProfileDropdown({
  user,
  logoutPending = false,
  open,
  onOpenChange,
  onProfile,
  onLogout,
}: ProfileDropdownProps) {
  const { t } = useI18n();
  const name = user.name || t('app.profileDropdown.userFallback');

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="ghost"
            className="
              h-10 gap-2 rounded-full px-1
              sm:px-2
            "
            aria-label={t('app.profileDropdown.open')}
          >
            <span className="
              flex size-8 items-center justify-center rounded-full bg-primary/10
              text-primary
            "
            >
              <User className="size-4" />
            </span>
            <span className="
              hidden text-left
              md:block
            "
            >
              <span className="block text-xs font-semibold">{name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {user.email || t('app.profileDropdown.emailFallback')}
              </span>
            </span>
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-sm font-semibold text-foreground">{name}</span>
            <span className="block">
              {user.roleLabel || t('app.profileDropdown.roleFallback')}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onProfile}>
            <User />
            {t('app.profileDropdown.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={logoutPending} onClick={onLogout}>
            <LogOut />
            {t(logoutPending ? 'app.profileDropdown.loggingOut' : 'app.profileDropdown.logout')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
