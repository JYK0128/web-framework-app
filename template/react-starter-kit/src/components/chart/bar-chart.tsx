import { ClientOnly } from '@tanstack/react-router';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ChartStyles, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';

type BarChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  layout?: 'horizontal' | 'vertical'
  styles?: ChartStyles<T, typeof Bar>
}>;

export function BarChart<T extends Record<string, unknown>>({ data, config, extra }: BarChartProps<T>) {
  const { layout = 'horizontal', category, values, styles } = extra;
  const isVerticalLayout = layout === 'vertical';

  return (
    <ClientOnly fallback={<BarChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={isVerticalLayout ? { left: 8, right: 16, top: 8, bottom: 8 } : { left: 0, right: 12, top: 8 }}
          barCategoryGap="24%"
          barGap={2}
        >
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={isVerticalLayout} horizontal={!isVerticalLayout} />
          {isVerticalLayout
            ? (
              <>
                <XAxis type="number" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis
                  dataKey={category}
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  interval="preserveStartEnd"
                  tickFormatter={(val: string) => String(val).replace(/\s+/g, '\u00A0')}
                />
              </>
            )
            : (
              <>
                <XAxis dataKey={category} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} interval="preserveStartEnd" />
                <YAxis type="number" tickLine={false} axisLine={false} width={36} interval="preserveStartEnd" />
              </>
            )}
          <ChartTooltip content={<ChartTooltipContent />} />
          {values.map((dataKey) => (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              fill={getChartColor(config, dataKey, styles?.[dataKey]?.color)}
              radius={6}
              {...styles?.[dataKey]}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsBarChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function BarChartSkeleton() {
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label="Loading chart">
      <svg className="size-full animate-pulse" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1" className="text-muted-foreground/15">
          <line x1="8" y1="218" x2="392" y2="218" />
        </g>
        <rect x="30" y="120" width="36" height="98" rx="4" fill="currentColor" className="text-chart-1/25" />
        <rect x="110" y="90" width="36" height="128" rx="4" fill="currentColor" className="text-chart-1/25" />
        <rect x="190" y="140" width="36" height="78" rx="4" fill="currentColor" className="text-chart-1/25" />
        <rect x="270" y="70" width="36" height="148" rx="4" fill="currentColor" className="text-chart-1/25" />
      </svg>
    </div>
  );
}
