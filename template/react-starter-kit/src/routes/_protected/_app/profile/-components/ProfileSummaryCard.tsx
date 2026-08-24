import { useI18n } from '@pkg/shared/web';
import { ShieldAlert, ShieldCheck, User } from 'lucide-react';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

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
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="
          flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted
          text-muted-foreground
        "
        >
          <User className="size-6" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <CardTitle>{user.name || t('profile.userFallback')}</CardTitle>
          <CardDescription className="truncate">{user.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs border-t pt-3">
          <span className="text-muted-foreground">{t('profile.twoFactorSecurity')}</span>
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
