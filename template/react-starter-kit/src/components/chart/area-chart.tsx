import { ClientOnly } from '@tanstack/react-router';
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ChartStyles, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';
import { useI18n } from '#/hooks';

type AreaChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: ChartStyles<T, typeof Area>
}>;

export function AreaChart<T extends Record<string, unknown>>({ data, config, extra }: AreaChartProps<T>) {
  const { category, values, styles } = extra;

  return (
    <ClientOnly fallback={<AreaChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsAreaChart data={data} margin={{ left: 0, right: 12, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={category} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={36} interval="preserveStartEnd" />
          <ChartTooltip content={<ChartTooltipContent />} />
          {values.map((dataKey) => {
            const options = styles?.[dataKey];
            const color = getChartColor(config, dataKey, options?.color);
            return (
              <Area
                key={dataKey}
                dataKey={dataKey}
                type="natural"
                fill={color}
                fillOpacity={0.4}
                stroke={color}
                {...options}
              />
            );
          })}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsAreaChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function AreaChartSkeleton() {
  const { t } = useI18n();
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label={t('app.chart.loading')}>
      <svg className="size-full animate-pulse" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M 8 200 Q 80 120 160 150 T 300 80 T 392 110 L 392 232 L 8 232 Z"
          fill="currentColor"
          className="text-chart-1/25"
        />
        <path
          d="M 8 215 Q 90 170 170 185 T 310 140 T 392 160 L 392 232 L 8 232 Z"
          fill="currentColor"
          className="text-chart-2/25"
        />
      </svg>
    </div>
  );
}
