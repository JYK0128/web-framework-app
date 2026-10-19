import type { ComponentProps, ElementType } from 'react';

import type { ChartConfig } from '#.generated/shadcn/components/ui/chart';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Extracts string keys from a data record type. */
export type DataKey<T> = Extract<keyof T, string>;

/**
 * Extracts component props omitting data/dataKey/ref to avoid Recharts generic spread type mismatches (ts2322).
 */
export type ComponentStyleProps<T extends ElementType> = Omit<
  Partial<ComponentProps<T>>,
  'data' | 'dataKey' | 'ref'
>;

/**
 * Maps series keys (DataKey<T>) to their element style properties.
 *
 * @example
 * styles?: ChartStyles<T, typeof Bar>
 */
export type ChartStyles<T, TComponent extends ElementType> = Partial<
  Record<DataKey<T>, ComponentStyleProps<TComponent>>
>;

// ---------------------------------------------------------------------------
// Base definition — shared fields for every chart variant
// ---------------------------------------------------------------------------

/**
 * Base shape for every chart definition.
 *
 * Compose this in each component's own Props type:
 * @example
 * type Props<T> = ChartDefinition<T[], {
 *   styles?: ChartStyles<T, typeof Bar>
 * }>;
 */
export type ChartDefinition<
  TData,
  TExtra extends Record<string, unknown> = Record<string, never>,
> = {
  id: string
  title: string
  description?: string
  data: TData
  config: ChartConfig
  extra: TExtra
};

// ---------------------------------------------------------------------------
// Scatter helper — groups data points into named series
// ---------------------------------------------------------------------------

export type ChartGroup<T> = {
  name: string
  /** Key used to look up color in ChartConfig; falls back to `name`. */
  configKey?: string
  data: T[]
  color?: string
};
