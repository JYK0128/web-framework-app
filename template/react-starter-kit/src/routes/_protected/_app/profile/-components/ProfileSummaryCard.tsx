import { useI18n } from '@pkg/shared/web';
import { ShieldAlert, ShieldCheck, User } from 'lucide-react';

import { Badge, Card, CardContent } from '#/.generated/shadcn/components/ui';

type ProfileSummaryCardProps = {
  user: {
    id: string
    name?: string | null
    email: string
    twoFactorEnabled?: boolean
  }
};

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  const { t } = useI18n();

  return (
    <Card className="p-6">
      <CardContent className="grid gap-6 p-0">
        <div className="flex items-center gap-4">
          <div className="
            flex size-12 shrink-0 items-center justify-center rounded-xl
            bg-muted text-muted-foreground
          "
          >
            <User className="size-6" />
          </div>
          <div className="grid flex-1 gap-0.5">
            <h2 className="text-base font-bold">{user.name || t('profile.userFallback')}</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="font-mono text-2xs text-muted-foreground">
              ID:
              {' '}
              {user.id}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4 text-xs">
          <span className="flex-1 text-muted-foreground">{t('profile.twoFactorSecurity')}</span>
          {user.twoFactorEnabled
            ? (
              <Badge
                variant="secondary"
                className="
                  flex items-center gap-1 shrink-0 text-emerald-600
                  dark:text-emerald-400
                "
              >
                <ShieldCheck className="size-3 shrink-0" />
                <span>{t('profile.enabled')}</span>
              </Badge>
            )
            : (
              <Badge
                variant="secondary"
                className="
                  flex items-center gap-1 shrink-0 text-amber-600
                  dark:text-amber-400
                "
              >
                <ShieldAlert className="size-3 shrink-0" />
                <span>{t('profile.disabled')}</span>
              </Badge>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
