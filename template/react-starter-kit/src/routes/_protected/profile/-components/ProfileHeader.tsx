import { useI18n } from '@pkg/shared/web';
import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

import { useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { LocaleSwitcher } from '#/components/app/locale-switcher';

export function ProfileHeader() {
  const navigate = useNavigate();
  const { mutateAsync: logout } = useAuthControllerLogout();
  const { t } = useI18n();

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
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
          <Badge variant="secondary" className="shrink-0">{t('profile.verifiedBadge')}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <LocaleSwitcher />
        <Button variant="outline" onClick={() => void handleLogout()}>
          <LogOut className="size-4" />
          <span>{t('profile.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
