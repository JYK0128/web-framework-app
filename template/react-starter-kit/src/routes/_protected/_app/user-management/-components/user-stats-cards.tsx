import { ShieldCheck, UserCheck, Users } from 'lucide-react';

import { StatsCard } from '#/components/app';

type UserStatsCardsProps = { total: string, admins: string, twoFactor: string };

export function UserStatsCards({ total, admins, twoFactor }: UserStatsCardsProps) {
  return (
    <div className="flex gap-4">
      <div className="h-30 w-60">
        <StatsCard
          className="size-full"
          label="사용자"
          value={total}
          icon={(
            <Users className="size-4 text-primary" />
          )}
        />
      </div>
      <div className="h-30 w-60">
        <StatsCard
          className="size-full"
          label="관리자"
          value={admins}
          textColor="text-amber-600"
          icon={(
            <UserCheck className="size-4 text-amber-500" />
          )}
        />
      </div>
      <div className="h-30 w-60">
        <StatsCard
          className="size-full"
          label="2FA 활성"
          value={twoFactor}
          textColor="text-emerald-600"
          icon={(
            <ShieldCheck className="size-4 text-emerald-500" />
          )}
        />
      </div>
    </div>
  );
}
