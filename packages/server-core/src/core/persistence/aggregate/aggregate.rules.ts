export const AGGREGATE_FIELD_TYPES = ['number', 'date', 'string', 'boolean'] as const;
export type AggregateFieldType = (typeof AGGREGATE_FIELD_TYPES)[number];

const functionRules = {
  count: { fieldTypes: ['number', 'date', 'string', 'boolean'] },
  sum: { fieldTypes: ['number'] },
  avg: { fieldTypes: ['number', 'date'] },
  min: { fieldTypes: ['number', 'date', 'string'] },
  max: { fieldTypes: ['number', 'date', 'string'] },
} as const satisfies Record<string, { fieldTypes: readonly AggregateFieldType[] }>;

export type AggregateFunction = keyof typeof functionRules;
export const AGGREGATE_FUNCTION_RULES: Record<AggregateFunction, { fieldTypes: readonly AggregateFieldType[] }> = functionRules;
export const AGGREGATE_FUNCTIONS = Object.keys(functionRules) as AggregateFunction[];
