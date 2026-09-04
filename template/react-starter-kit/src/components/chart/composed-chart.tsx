import { ClientOnly } from '@tanstack/react-router';
import { omit } from 'lodash-es';
import { Area, Bar, CartesianGrid, ComposedChart as RechartsComposedChart, Line, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ComponentStyleProps, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';
import { useI18n } from '#/hooks';

type BarStyle = { type: 'bar' } & Omit<ComponentStyleProps<typeof Bar>, 'type'>;
type AreaStyle = { type: 'area' } & Omit<ComponentStyleProps<typeof Area>, 'type'>;
type LineStyle = { type: 'line' } & Omit<ComponentStyleProps<typeof Line>, 'type'>;

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
            const color = getChartColor(config, dataKey, options?.color);
            const rest = omit(options, ['type', 'color']);

            switch (options?.type ?? 'bar') {
              case 'area':
                return <Area key={dataKey} dataKey={dataKey} type="natural" fill={color} stroke={color} fillOpacity={0.4} {...rest} />;
              case 'line':
                return <Line key={dataKey} dataKey={dataKey} type="monotone" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 6 }} {...rest} />;
              case 'bar':
                return <Bar key={dataKey} dataKey={dataKey} fill={color} radius={4} {...rest} />;
            }
          })}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsComposedChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function ComposedChartSkeleton() {
  const { t } = useI18n();
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label={t('chart.loading')}>
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
