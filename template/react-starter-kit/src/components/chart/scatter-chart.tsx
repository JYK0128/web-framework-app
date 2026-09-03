import { ClientOnly } from '@tanstack/react-router';
import { CartesianGrid, Scatter, ScatterChart as RechartsScatterChart, XAxis, YAxis, ZAxis } from 'recharts';

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartDefinition, ComponentStyleProps, DataKey } from '#/components/chart/chart-types';
import { getChartColor } from '#/components/chart/chart-utils';
import { useI18n } from '#/hooks';

/**
 * Extracts dot-notation paths for array keys and nested point keys.
 * e.g. T = { name: string, data: { x: number, y: number }[] }
 * -> ScatterValueKeys<T> = 'data.x' | 'data.y'
 */
type ScatterValueKeys<T> = {
  [K in Extract<keyof T, string>]: NonNullable<T[K]> extends Array<infer Item>
    ? Item extends Record<string, unknown>
      ? `${K}.${Extract<keyof Item, string>}`
      : never
    : never;
}[Extract<keyof T, string>];

type ScatterPath<T> = ScatterValueKeys<T> | (string & {});

type ScatterChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  /** Dot notation paths to nested point array and axes keys, e.g. `['data.x', 'data.y']`. */
  values: readonly [ScatterPath<T>, ScatterPath<T>]
  styles?: ComponentStyleProps<typeof Scatter>
}>;

/** Internal key injected into each point so the tooltip can display the series name. */
const SCATTER_GROUP_KEY = '__scatterGroup';

export function ScatterChart<T extends Record<string, unknown>>({ data: groups, config, extra }: ScatterChartProps<T>) {
  const { category, values, styles } = extra;
  const [xPath, yPath] = values;

  const [arrayKey, xKey] = xPath.split('.');
  const [, yKey] = yPath.split('.');

  return (
    <ClientOnly fallback={<ScatterChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <RechartsScatterChart>
          <CartesianGrid />
          <XAxis dataKey={xKey} type="number" tickLine={false} axisLine={false} />
          <YAxis dataKey={yKey} type="number" tickLine={false} axisLine={false} />
          <ZAxis range={[60, 400]} />
          <ChartTooltip content={<ChartTooltipContent nameKey={SCATTER_GROUP_KEY} />} />
          {groups.map((group) => {
            const groupName = group[category] as string;
            const configKey = (group.configKey as string) ?? groupName;
            const points = (group[arrayKey] as Record<string, unknown>[]) ?? [];

            return (
              <Scatter
                key={groupName}
                name={groupName}
                data={points.map((point) => ({ ...point, [SCATTER_GROUP_KEY]: groupName }))}
                fill={getChartColor(config, configKey, group.color as string | undefined)}
                {...styles}
              />
            );
          })}
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsScatterChart>
      </ChartContainer>
    </ClientOnly>
  );
}

function ScatterChartSkeleton() {
  const { t } = useI18n();
  return (
    <div className="size-full rounded-lg border border-dashed p-4" role="status" aria-label={t('common.loadingChart')}>
      <svg className="size-full animate-pulse" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <g
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/15"
        >
          <line x1="42" y1="24" x2="42" y2="210" />
          <line x1="42" y1="210" x2="388" y2="210" />
          <line x1="42" y1="70" x2="388" y2="70" strokeDasharray="5 7" />
          <line x1="42" y1="116" x2="388" y2="116" strokeDasharray="5 7" />
          <line x1="42" y1="162" x2="388" y2="162" strokeDasharray="5 7" />
          <line x1="128" y1="24" x2="128" y2="210" strokeDasharray="5 7" />
          <line x1="215" y1="24" x2="215" y2="210" strokeDasharray="5 7" />
          <line x1="301" y1="24" x2="301" y2="210" strokeDasharray="5 7" />
        </g>
        <g fill="currentColor" className="text-chart-1/25">
          <circle cx="94" cy="178" r="5" />
          <circle cx="128" cy="150" r="6" />
          <circle cx="162" cy="160" r="5" />
        </g>
        <g fill="currentColor" className="text-chart-2/25">
          <circle cx="214" cy="116" r="7" />
          <circle cx="266" cy="126" r="5" />
        </g>
        <g fill="currentColor" className="text-chart-3/25">
          <circle cx="318" cy="76" r="6" />
          <circle cx="370" cy="54" r="5" />
        </g>
      </svg>
    </div>
  );
}
