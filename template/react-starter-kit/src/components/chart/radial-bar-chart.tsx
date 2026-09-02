import { ClientOnly } from '@tanstack/react-router';
import { useI18n } from '#/hooks';
import { RadialBar, RadialBarChart as RechartsRadialBarChart } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ComponentStyleProps, DataKey } from '#/components/chart/chart-types';

type RadialBarChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: ComponentStyleProps<typeof RadialBar>
}>;

export function RadialBarChart<T extends Record<string, unknown>>({ data, config, extra }: RadialBarChartProps<T>) {
  const { category, values, styles } = extra;
  const dataKey = values[0]!;

  return (
    <ClientOnly fallback={<RadialBarChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsRadialBarChart innerRadius="20%" outerRadius="90%" data={data} startAngle={90} endAngle={-270}>
          <ChartTooltip content={<ChartTooltipContent nameKey={category} />} />
          <RadialBar dataKey={dataKey} background cornerRadius={6} {...styles} />
          <ChartLegend content={<ChartLegendContent nameKey={category} />} />
        </RechartsRadialBarChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function RadialBarChartSkeleton() {
  const { t } = useI18n();
  return (
    <div className="flex size-full items-center justify-center rounded-lg border border-dashed" role="status" aria-label={t('common.loadingChart')}>
      <svg className="size-full animate-pulse" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="64" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="280 122" strokeLinecap="round" className="text-chart-2/25" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" r="49" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="205 103" strokeLinecap="round" className="text-chart-3/25" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" r="34" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="145 69" strokeLinecap="round" className="text-chart-4/25" transform="rotate(-90 80 80)" />
        <circle cx="80" cy="80" r="19" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="82 37" strokeLinecap="round" className="text-chart-5/25" transform="rotate(-90 80 80)" />
      </svg>
    </div>
  );
}
