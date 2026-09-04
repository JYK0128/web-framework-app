import { ClientOnly } from '@tanstack/react-router';
import { Treemap, type TreemapNode } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '#/.generated/shadcn/components/ui';
import type { ChartConfig } from '#/.generated/shadcn/components/ui/chart';
import type { ChartDefinition, ComponentStyleProps, DataKey } from '#/components/chart/chart-types';
import { useI18n } from '#/hooks';

type TreemapChartProps<T extends Record<string, unknown>> = ChartDefinition<T[], {
  category: DataKey<T>
  values: readonly DataKey<T>[]
  styles?: ComponentStyleProps<typeof Treemap>
}>;

export function TreemapChart<T extends Record<string, unknown>>({ data, config, extra }: TreemapChartProps<T>) {
  const { category, values, styles } = extra;
  const dataKey = values[0];

  return (
    <ClientOnly fallback={<TreemapChartSkeleton />}>
      <ChartContainer config={config} className="size-full">
        <Treemap
          data={data}
          dataKey={dataKey}
          aspectRatio={4 / 3}
          stroke="var(--background)"
          fill="var(--chart-1)"
          content={(node) => <TreemapCell node={node} config={config} colorKey={category} />}
          {...styles}
        >
          <ChartTooltip content={<ChartTooltipContent nameKey={category} />} />
        </Treemap>
      </ChartContainer>
    </ClientOnly>
  );
}

type TreemapCellProps = { node: TreemapNode, config: ChartConfig, colorKey: string };

function TreemapCell({ node, config, colorKey }: TreemapCellProps) {
  const colorValue = node[colorKey];
  const configKey = typeof colorValue === 'string' || typeof colorValue === 'number'
    ? String(colorValue)
    : '';
  const fill = config[configKey]?.color ?? 'var(--chart-1)';
  const showLabel = node.width > 20 && node.height > 20 && Boolean(node.name);

  return (
    <g>
      <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={fill} stroke="var(--background)" />
      {showLabel
        ? (
          <text
            x={node.x + node.width / 2}
            y={node.y + node.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--foreground)"
            fontSize={14}
          >
            {node.name}
          </text>
        )
        : null}
    </g>
  );
}

function TreemapChartSkeleton() {
  const { t } = useI18n();
  return (
    <div className="size-full rounded-lg border border-dashed p-2" role="status" aria-label={t('common.loading')}>
      <svg className="size-full animate-pulse text-muted-foreground/20" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">
        <rect
          x="4"
          y="4"
          width="238"
          height="138"
          rx="3"
          fill="currentColor"
          className="text-chart-1/25"
        />
        <rect
          x="246"
          y="4"
          width="150"
          height="82"
          rx="3"
          fill="currentColor"
          className="text-chart-2/25"
        />
        <rect
          x="246"
          y="90"
          width="150"
          height="146"
          rx="3"
          fill="currentColor"
          className="text-chart-3/25"
        />
        <rect
          x="4"
          y="148"
          width="112"
          height="88"
          rx="3"
          fill="currentColor"
          className="text-chart-4/25"
        />
        <rect
          x="120"
          y="148"
          width="122"
          height="88"
          rx="3"
          fill="currentColor"
          className="text-chart-5/25"
        />
      </svg>
    </div>
  );
}
