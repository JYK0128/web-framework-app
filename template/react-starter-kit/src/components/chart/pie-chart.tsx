import { ClientOnly } from '@tanstack/react-router';
import { Pie, PieChart as RechartsPieChart } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ComponentStyleProps, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';
import { useI18n } from '#/hooks';

type PieChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: ComponentStyleProps<typeof Pie>
}>;

export function PieChart<T extends Record<string, unknown>>({ data, config, extra }: PieChartProps<T>) {
  const { category, values, styles } = extra;
  const dataKey = values[0];
  const chartData = data.map((item) => ({
    ...item,
    fill: getChartColor(config, item[category] as string),
  }));

  return (
    <ClientOnly fallback={<PieChartSkeleton />}>
      <ChartContainer config={config} className="mx-auto size-full">
        <RechartsPieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey={category} hideLabel />} />
          <Pie data={chartData} dataKey={dataKey} nameKey={category} innerRadius="32%" outerRadius="68%" paddingAngle={3} {...styles} />
          <ChartLegend content={<ChartLegendContent nameKey={category} />} />
        </RechartsPieChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function PieChartSkeleton() {
  const { t } = useI18n();
  return (
    <div
      className="
        flex size-full items-center justify-center rounded-lg border
        border-dashed
      "
      role="status"
      aria-label={t('common.loading')}
    >
      <svg className="size-full animate-pulse" viewBox="0 0 200 200" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="34"
          strokeDasharray="130 452"
          className="text-chart-1/25"
          transform="rotate(-90 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="34"
          strokeDasharray="105 452"
          strokeDashoffset="-140"
          className="text-chart-2/25"
          transform="rotate(-90 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="34"
          strokeDasharray="85 452"
          strokeDashoffset="-255"
          className="text-chart-3/25"
          transform="rotate(-90 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="34"
          strokeDasharray="60 452"
          strokeDashoffset="-350"
          className="text-chart-4/25"
          transform="rotate(-90 100 100)"
        />
      </svg>
    </div>
  );
}
