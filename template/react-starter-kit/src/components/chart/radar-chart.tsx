import { ClientOnly } from '@tanstack/react-router';
import { useI18n } from '@pkg/shared/web';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ChartStyles, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';

type RadarChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: ChartStyles<T, typeof Radar>
}>;

export function RadarChart<T extends Record<string, unknown>>({ data, config, extra }: RadarChartProps<T>) {
  const { category, values, styles } = extra;

  return (
    <ClientOnly fallback={<RadarChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsRadarChart data={data} outerRadius="72%">
          <PolarGrid />
          <PolarAngleAxis dataKey={category} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {values.map((dataKey) => {
            const options = styles?.[dataKey];
            const color = getChartColor(config, dataKey, options?.color);
            return (
              <Radar
                key={dataKey}
                dataKey={dataKey}
                fill={color}
                fillOpacity={0.4}
                stroke={color}
                {...options}
              />
            );
          })}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsRadarChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function RadarChartSkeleton() {
  const { t } = useI18n();
  return (
    <div className="flex size-full items-center justify-center rounded-lg border border-dashed p-4" role="status" aria-label={t('common.loadingChart')}>
      <svg className="size-full animate-pulse" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <polygon points="100,20 176,64 176,152 100,196 24,152 24,64" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/15" />
        <polygon points="100,50 148,78 148,134 100,162 52,134 52,78" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/15" />
        <polygon points="100,35 160,70 140,140 90,170 40,135 45,75" fill="currentColor" className="text-chart-1/25" />
      </svg>
    </div>
  );
}
