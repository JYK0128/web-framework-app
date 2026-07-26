import { ClientOnly } from '@tanstack/react-router';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ChartStyles, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';

type StackedBarChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  layout?: 'horizontal' | 'vertical'
  styles?: ChartStyles<T, typeof Bar>
}>;

export function StackedBarChart<T extends Record<string, unknown>>({ data, config, extra }: StackedBarChartProps<T>) {
  const { layout = 'horizontal', category, values, styles } = extra;
  const isVerticalLayout = layout === 'vertical';

  return (
    <ClientOnly fallback={<StackedBarChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={isVerticalLayout ? { left: 8, right: 16, top: 8, bottom: 8 } : { left: 0, right: 12, top: 8 }}
        >
          <CartesianGrid vertical={isVerticalLayout} horizontal={!isVerticalLayout} />
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
                <XAxis dataKey={category} tickLine={false} axisLine={false} minTickGap={16} interval="preserveStartEnd" />
                <YAxis type="number" tickLine={false} axisLine={false} width={36} interval="preserveStartEnd" />
              </>
            )}
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {values.map((dataKey) => (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              stackId="stack"
              fill={getChartColor(config, dataKey, styles?.[dataKey]?.color)}
              radius={4}
              {...styles?.[dataKey]}
            />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function StackedBarChartSkeleton() {
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label="Loading chart">
      <svg className="size-full animate-pulse" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1" className="text-muted-foreground/15">
          <line x1="8" y1="28" x2="392" y2="28" />
          <line x1="8" y1="78" x2="392" y2="78" />
          <line x1="8" y1="128" x2="392" y2="128" />
          <line x1="8" y1="178" x2="392" y2="178" />
          <line x1="8" y1="218" x2="392" y2="218" />
        </g>
        <g>
          <rect x="24" y="148" width="44" height="70" rx="4" fill="currentColor" className="text-chart-1/25" />
          <rect x="24" y="116" width="44" height="32" rx="4" fill="currentColor" className="text-chart-2/25" />
          <rect x="24" y="94" width="44" height="22" rx="4" fill="currentColor" className="text-chart-3/25" />
          <rect x="100" y="132" width="44" height="86" rx="4" fill="currentColor" className="text-chart-1/25" />
          <rect x="100" y="92" width="44" height="40" rx="4" fill="currentColor" className="text-chart-2/25" />
          <rect x="100" y="70" width="44" height="22" rx="4" fill="currentColor" className="text-chart-3/25" />
          <rect x="176" y="120" width="44" height="98" rx="4" fill="currentColor" className="text-chart-1/25" />
          <rect x="176" y="88" width="44" height="32" rx="4" fill="currentColor" className="text-chart-2/25" />
          <rect x="176" y="58" width="44" height="30" rx="4" fill="currentColor" className="text-chart-3/25" />
          <rect x="252" y="106" width="44" height="112" rx="4" fill="currentColor" className="text-chart-1/25" />
          <rect x="252" y="74" width="44" height="32" rx="4" fill="currentColor" className="text-chart-2/25" />
          <rect x="252" y="48" width="44" height="26" rx="4" fill="currentColor" className="text-chart-3/25" />
          <rect x="328" y="128" width="44" height="90" rx="4" fill="currentColor" className="text-chart-1/25" />
          <rect x="328" y="82" width="44" height="46" rx="4" fill="currentColor" className="text-chart-2/25" />
          <rect x="328" y="62" width="44" height="20" rx="4" fill="currentColor" className="text-chart-3/25" />
        </g>
      </svg>
    </div>
  );
}
