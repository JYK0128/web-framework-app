import { AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';

import type { ActivityStatsResponseDto } from '#/.generated/api/model';
import { StatsCard } from '#/components/app';

type ActivityStatsCardsProps = { stats: ActivityStatsResponseDto, translate: (key: string) => string };

export function ActivityStatsCards({ stats, translate }: ActivityStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatsCard
        label={translate('activityLogs.totalRequests')}
        value={stats.totalRequests.toLocaleString()}
        icon={(
          <Zap className="size-4 text-blue-500" />
        )}
      />
      <StatsCard
        label={translate('activityLogs.last24h')}
        value={stats.last24hCount.toLocaleString()}
        icon={(
          <Clock className="size-4 text-emerald-500" />
        )}
      />
      <StatsCard
        label={translate('activityLogs.errorRate')}
        value={`${stats.errorRate}%`}
        textColor={stats.errorRate > 5 ? 'text-rose-500' : undefined}
        icon={(
          <AlertTriangle className="size-4 text-rose-500" />
        )}
      />
      <StatsCard
        label={translate('activityLogs.avgDuration')}
        value={`${stats.avgDuration} ms`}
        icon={(
          <CheckCircle2 className="size-4 text-cyan-500" />
        )}
      />
    </div>
  );
}
