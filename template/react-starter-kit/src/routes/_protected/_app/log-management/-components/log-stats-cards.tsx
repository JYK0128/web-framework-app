import { valueIf } from '@pkg/shared/common';

import type { LogStatsResponseDto } from '#/.generated/api/model';
import { StatsCard } from '#/components/layout';

export type LogStatsCardsProps = {
  stats: LogStatsResponseDto
  isLoading?: boolean
  translate: (key: string, options?: Record<string, unknown>) => string
};

export function LogStatsCards({ stats, isLoading = false, translate }: LogStatsCardsProps) {
  return (
    <div className="
      grid grid-cols-2 gap-4
      md:grid-cols-4
    "
    >
      <StatsCard
        label={translate('logManagement.totalRequests')}
        value={stats.totalRequests.toLocaleString()}
        isLoading={isLoading}
        icon="zap"
        iconColor="text-blue-500"
      />
      <StatsCard
        label={translate('logManagement.errorCount')}
        value={stats.errorCount.toLocaleString()}
        isLoading={isLoading}
        textColor={valueIf(stats.errorCount > 0, 'text-rose-500')}
        icon="x-circle"
        iconColor="text-rose-500"
      />
      <StatsCard
        label={translate('logManagement.errorRate')}
        value={`${stats.errorRate}%`}
        isLoading={isLoading}
        textColor={valueIf(stats.errorRate > 5, 'text-rose-500')}
        icon="triangle-alert"
        iconColor="text-amber-500"
      />
      <StatsCard
        label={translate('logManagement.avgDuration')}
        value={`${stats.avgDuration} ms`}
        isLoading={isLoading}
        icon="check-circle-2"
        iconColor="text-emerald-500"
      />
    </div>
  );
}
