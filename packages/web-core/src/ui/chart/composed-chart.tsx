import { ClientOnly } from '@tanstack/react-router';
import { Area, Bar, CartesianGrid, ComposedChart as RechartsComposedChart, Line, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#.generated/shadcn/components/ui/chart';
import type { ChartDefinition, DataKey } from '#ui/chart/chart-types';
import { getChartColor } from '#ui/chart/chart-utils';

type BarStyle = { type: 'bar', color?: string, radius?: number, stackId?: string, maxBarSize?: number, minPointSize?: number };
type AreaStyle = { type: 'area', color?: string, fillOpacity?: number, strokeWidth?: number, dot?: boolean };
type LineStyle = { type: 'line', color?: string, strokeWidth?: number, dot?: boolean, strokeDasharray?: string };

type ComposedSeriesStyle = BarStyle | AreaStyle | LineStyle;

type ComposedChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: Partial<Record<DataKey<T>, ComposedSeriesStyle>>
}>;

export function ComposedChart<T extends Record<string, unknown>>({ data, config, extra }: ComposedChartProps<T>) {
  const { category, values, styles } = extra;

  return (
    <ClientOnly fallback={<ComposedChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsComposedChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey={category} tickLine={false} axisLine={false} minTickGap={16} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={36} interval="preserveStartEnd" />
          <ChartTooltip content={<ChartTooltipContent />} />
          {values.map((dataKey) => {
            const options = styles?.[dataKey];
            if (options?.type === 'area') {
              const color = getChartColor(config, dataKey, options.color);
              return <Area key={dataKey} dataKey={dataKey} type="natural" fill={color} stroke={color} fillOpacity={0.4} {...stripSeriesTypeAndColor(options)} />;
            }

            if (options?.type === 'line') {
              const color = getChartColor(config, dataKey, options.color);
              return <Line key={dataKey} dataKey={dataKey} type="monotone" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 6 }} {...stripSeriesTypeAndColor(options)} />;
            }

            const barOptions = options?.type === 'bar' ? options : undefined;
            const color = getChartColor(config, dataKey, barOptions?.color);
            return <Bar key={dataKey} dataKey={dataKey} fill={color} radius={4} {...(barOptions ? stripSeriesTypeAndColor(barOptions) : {})} />;
          })}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsComposedChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function stripSeriesTypeAndColor<T extends { type: string, color?: string }>(style: T): Omit<T, 'type' | 'color'> {
  const { type: _type, color: _color, ...props } = style;
  return props;
}

function ComposedChartSkeleton() {
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label="Loading chart">
      <svg className="size-full animate-pulse" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <g
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/15"
        >
          <line x1="8" y1="218" x2="392" y2="218" />
        </g>
        <rect
          x="30"
          y="120"
          width="36"
          height="98"
          rx="4"
          fill="currentColor"
          className="text-chart-1/25"
        />
        <rect
          x="110"
          y="90"
          width="36"
          height="128"
          rx="4"
          fill="currentColor"
          className="text-chart-1/25"
        />
        <rect
          x="190"
          y="140"
          width="36"
          height="78"
          rx="4"
          fill="currentColor"
          className="text-chart-1/25"
        />
        <rect
          x="270"
          y="70"
          width="36"
          height="148"
          rx="4"
          fill="currentColor"
          className="text-chart-1/25"
        />
        <path
          d="M 48 100 L 128 70 L 208 120 L 288 50 L 368 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-chart-2/25"
        />
      </svg>
    </div>
  );
}
