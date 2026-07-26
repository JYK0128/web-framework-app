import { ClientOnly } from '@tanstack/react-router';
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ChartStyles, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';

type LineChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: ChartStyles<T, typeof Line>
}>;

export function LineChart<T extends Record<string, unknown>>({ data, config, extra }: LineChartProps<T>) {
  const { category, values, styles } = extra;

  return (
    <ClientOnly fallback={<LineChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsLineChart data={data} margin={{ left: 0, right: 12, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={category} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={36} interval="preserveStartEnd" />
          <ChartTooltip content={<ChartTooltipContent />} />
          {values.map((dataKey) => {
            const options = styles?.[dataKey];
            const color = getChartColor(config, dataKey, options?.color);
            return (
              <Line
                key={dataKey}
                dataKey={dataKey}
                type={options?.type ?? 'monotone'}
                stroke={color}
                strokeWidth={options?.strokeWidth ?? 2}
                dot={options?.dot ?? false}
                activeDot={options?.activeDot ?? { r: 6 }}
                {...options}
              />
            );
          })}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsLineChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function LineChartSkeleton() {
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label="Loading chart">
      <svg className="size-full animate-pulse text-muted-foreground/20" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 12 180 Q 80 120 160 140 T 310 70 T 388 90" fill="none" stroke="currentColor" strokeWidth="3" className="text-chart-1/25" />
        <path d="M 12 210 Q 90 170 170 180 T 310 130 T 388 140" fill="none" stroke="currentColor" strokeWidth="3" className="text-chart-2/25" />
      </svg>
    </div>
  );
}
