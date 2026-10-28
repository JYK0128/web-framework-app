import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { Allow, IsOptional } from 'class-validator';

import { combineQuery, type QueryBaseClass, type QueryOptions } from './query.shared';

export const FilterOperator = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  IN: 'in',
  NIN: 'nin',
  LIKE: 'like',
  ILIKE: 'ilike',
} as const;
export type FilterOperator = (typeof FilterOperator)[keyof typeof FilterOperator];

export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date';
export type FilterFieldDefinition = {
  type: FilterFieldType
  operators?: readonly FilterOperator[]
};
export type FilterFieldDefinitions<TEntity extends object> = Partial<Record<Extract<keyof TEntity, string>, FilterFieldDefinition>>;

const operatorMap: Record<FilterOperator, string> = {
  eq: '$eq',
  ne: '$ne',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
  in: '$in',
  nin: '$nin',
  like: '$like',
  ilike: '$ilike',
};

const defaultOperators: Record<FilterFieldType, readonly FilterOperator[]> = {
  string: ['eq', 'ne', 'in', 'nin', 'like', 'ilike'],
  number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'],
  boolean: ['eq', 'ne'],
  date: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'],
};

type ScalarFilterValue<TValue> = NonNullable<TValue> extends Date
  ? Date | string
  : NonNullable<TValue> extends number
    ? number | string
    : NonNullable<TValue> extends boolean
      ? boolean | string
      : NonNullable<TValue> extends string
        ? string
        : never;
type FilterOperatorsFor<TValue> = NonNullable<TValue> extends Date
  ? typeof FilterOperator.EQ | typeof FilterOperator.NE | typeof FilterOperator.GT | typeof FilterOperator.GTE | typeof FilterOperator.LT | typeof FilterOperator.LTE | typeof FilterOperator.IN | typeof FilterOperator.NIN
  : NonNullable<TValue> extends number
    ? typeof FilterOperator.EQ | typeof FilterOperator.NE | typeof FilterOperator.GT | typeof FilterOperator.GTE | typeof FilterOperator.LT | typeof FilterOperator.LTE | typeof FilterOperator.IN | typeof FilterOperator.NIN
    : NonNullable<TValue> extends string
      ? typeof FilterOperator.EQ | typeof FilterOperator.NE | typeof FilterOperator.IN | typeof FilterOperator.NIN | typeof FilterOperator.LIKE | typeof FilterOperator.ILIKE
      : NonNullable<TValue> extends boolean
        ? typeof FilterOperator.EQ | typeof FilterOperator.NE
        : never;
type FilterValueFor<TValue, TOperator> = TOperator extends typeof FilterOperator.IN | typeof FilterOperator.NIN
  ? ScalarFilterValue<TValue>[]
  : ScalarFilterValue<TValue>;
export type FieldFilter<TValue> = Partial<{
  [TOperator in FilterOperatorsFor<TValue>]: FilterValueFor<TValue, TOperator>
}>;
export type Filters<TEntity extends object> = Partial<{
  [TKey in keyof TEntity as Extract<TKey, string>]: FieldFilter<TEntity[TKey]>
}>;

class FilterQueryParser<TEntity extends object> {
  constructor(private readonly filters: Filters<TEntity>, private readonly definitions: FilterFieldDefinitions<TEntity>) {}

  toQuery(): ObjectQuery<TEntity> {
    const definitions = this.definitions as Record<string, FilterFieldDefinition | undefined>;
    const conditions: Record<string, unknown>[] = [];

    if (!this.filters || typeof this.filters !== 'object' || Array.isArray(this.filters)) {
      this.invalidFilter('Filters must be an object keyed by entity field');
    }

    for (const [field, fieldFilters] of Object.entries(this.filters)) {
      const definition = definitions[field];
      if (!Object.hasOwn(definitions, field) || !definition) this.invalidFilter(`Filtering by "${field}" is not allowed`);
      conditions.push(this.toFieldCondition(field, fieldFilters, definition));
    }

    return (conditions.length ? { $and: conditions } : {}) as ObjectQuery<TEntity>;
  }

  private toFieldCondition(field: string, fieldFilters: unknown, definition: FilterFieldDefinition): Record<string, unknown> {
    if (!fieldFilters || typeof fieldFilters !== 'object' || Array.isArray(fieldFilters)) {
      this.invalidFilter(`Filters for "${field}" must be an operator object`);
    }
    const operators: Record<string, unknown> = {};
    const entries = Object.entries(fieldFilters);
    if (entries.length === 0) this.invalidFilter(`At least one operator is required for "${field}"`);
    for (const [operatorName, filterValue] of entries) {
      if (!Object.values(FilterOperator).includes(operatorName as FilterOperator)) {
        this.invalidFilter(`Operator "${operatorName}" is not supported`);
      }
      const operator = operatorName as FilterOperator;
      if (!defaultOperators[definition.type].includes(operator)
        || (definition.operators && !definition.operators.includes(operator))) {
        this.invalidFilter(`Operator "${operator}" is not allowed for "${field}"`);
      }
      operators[operatorMap[operator]] = this.parseValue(filterValue, definition.type, operator);
    }
    return { [field]: operators };
  }

  private parseValue(value: unknown, type: FilterFieldType, operator: FilterOperator): unknown {
    const usesMultipleValues = operator === FilterOperator.IN || operator === FilterOperator.NIN;
    const values = usesMultipleValues && Array.isArray(value) ? value : [value];
    if ((operator === FilterOperator.IN || operator === FilterOperator.NIN) && values.length === 0) {
      this.invalidFilter(`Operator "${operator}" requires at least one value`);
    }
    return usesMultipleValues ? values.map((item) => this.parseScalar(item, type)) : this.parseScalar(values[0], type);
  }

  private parseScalar(item: unknown, type: FilterFieldType): unknown {
    switch (type) {
      case 'string': return this.parseString(item);
      case 'number': return this.parseNumber(item);
      case 'boolean': return this.parseBoolean(item);
      case 'date': return this.parseDate(item);
    }
  }

  private parseString(item: unknown): string {
    if (typeof item !== 'string') this.invalidFilter('String filter values must be strings');
    return item;
  }

  private parseNumber(item: unknown): number {
    if (typeof item === 'string' && item.trim() === '') this.invalidFilter('Number filter values must not be empty');
    const number = typeof item === 'number' ? item : Number(item);
    if (!Number.isFinite(number)) this.invalidFilter('Number filter values must be finite numbers');
    return number;
  }

  private parseBoolean(item: unknown): boolean {
    if (item === true || item === 'true') return true;
    if (item === false || item === 'false') return false;
    return this.invalidFilter('Boolean filter values must be true or false');
  }

  private parseDate(item: unknown): Date {
    const date = item instanceof Date ? item : new Date(String(item));
    if (!Number.isFinite(date.getTime())) this.invalidFilter('Date filter values must be valid dates');
    return date;
  }

  private invalidFilter(message: string): never {
    throw new ApplicationError({ code: 'VALIDATION_ERROR', status: 400, message });
  }
}

export function ApiFiltersProperty() {
  return ApiPropertyOptional({
    type: 'object',
    description: '필드별 필터. 엔드포인트가 허용한 필드만 사용할 수 있으며, 허용되지 않은 필드는 400 오류를 반환합니다. 예: filters[createdAt][gte]=2026-01-01',
    additionalProperties: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          { type: 'array', items: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] } },
        ],
      },
    },
    example: { createdAt: { gte: '2026-01-01', lt: '2026-02-01' } },
  });
}

export type FilterPart<TEntity extends object> = { filters: Filters<TEntity> };

export function withFilter<TEntity extends object>(Base: QueryBaseClass<TEntity>, fields: FilterFieldDefinitions<TEntity>) {
  class FilterQuery extends Base {
    @ApiFiltersProperty()
    @IsOptional()
    @Allow()
    filters: Filters<TEntity> = {};

    override toQuery(): QueryOptions<TEntity> {
      const query = super.toQuery();
      return { ...query, where: combineQuery(query.where, new FilterQueryParser(this.filters, fields).toQuery()) };
    }
  }
  return FilterQuery;
}
