import type { ChartConfig } from '#.generated/shadcn/components/ui/chart';

/**
 * Resolves a fill/stroke color for a given data key.
 *
 * Priority: explicit override → config.color → CSS variable `--color-<key>`
 *
 * Prefer using shadcn's built-in `ChartTooltipContent` / `ChartLegendContent`
 * (which use `getPayloadConfigFromPayload` internally) over calling this
 * directly wherever possible.  This helper is only needed when you must
 * resolve a color at render time — e.g. for `<Cell>` fills or `<Scatter>`
 * fills that recharts cannot derive on its own.
 */
export function getChartColor(config: ChartConfig, dataKey: string, override?: string) {
  return override ?? config[dataKey]?.color ?? `var(--color-${dataKey})`;
}
