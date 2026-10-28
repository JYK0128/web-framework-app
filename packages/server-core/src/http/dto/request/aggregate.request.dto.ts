import type { RawQueryFragment } from '@mikro-orm/core';
import type { Type } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { Type as TransformType } from 'class-transformer';
import { Allow, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Min, ValidateIf, ValidateNested } from 'class-validator';

import { AGGREGATE_FUNCTION_RULES, AGGREGATE_FUNCTIONS, type AggregateFieldType, type AggregateFunction } from '#core/persistence/aggregate/aggregate.rules';
import type { AggregateGroupExpression, AggregateHaving, AggregateOrderBy, AggregateSpec } from '#core/persistence/aggregate/aggregate.types';
import { BaseDto } from '#http/dto/base/base.dto';
import { EntityDto, type EntityDtoFields } from '#http/dto/base/entity.dto';

export class AggregateMetricRequestDto extends BaseDto {
  @ApiProperty({ example: 'eventCount' })
  @IsString()
  @Matches(/^[A-Za-z_]\w*$/)
  name!: string;

  @ApiProperty({ enum: AGGREGATE_FUNCTIONS })
  @IsIn(AGGREGATE_FUNCTIONS)
  function!: AggregateFunction;

  @ApiPropertyOptional({ example: 'startsAt' })
  @IsOptional()
  @IsString()
  field?: string;
}

const havingOperators: AggregateHaving['op'][] = ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'];

class AggregateHavingRequestDto extends BaseDto {
  @ApiProperty({ example: 'eventCount' })
  @IsString()
  @Matches(/^[A-Za-z_]\w*$/)
  field!: string;

  @ApiProperty({ enum: havingOperators })
  @IsIn(havingOperators)
  op!: AggregateHaving['op'];

  @ApiProperty({ oneOf: [{ type: 'number' }, { type: 'string' }] })
  @Allow()
  value!: number | string;
}

class AggregateOrderByRequestDto extends BaseDto {
  @ApiProperty({ example: 'eventCount' })
  @IsString()
  @Matches(/^[A-Za-z_]\w*$/)
  field!: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc'])
  direction!: 'asc' | 'desc';
}

export type AggregateRequestDefinition<TEntity extends object> = {
  fields: Record<string, { field: keyof TEntity & string, type: AggregateFieldType }>
  dimensions: Record<string, { field: keyof TEntity & string } | { expression: (alias: string) => RawQueryFragment }>
  defaultMetrics: readonly { name: string, function: AggregateFunction, field?: string }[]
};

export type AggregateRequestQuery<TEntity extends object> = {
  groupBy: (keyof TEntity & string)[]
  groupByExpressions: AggregateGroupExpression<string>[]
  aggregates: AggregateSpec<TEntity>
  having?: AggregateHaving[]
  orderBy?: AggregateOrderBy[]
  take?: number
};

function invalidAggregate(message: string): never {
  throw new ApplicationError({ code: 'VALIDATION_ERROR', status: 400, message });
}

/** Creates a request body whose aggregate fields and dimensions are owned by the endpoint. */
export function AggregateRequestDto<TEntity extends object>(
  entity: Type<TEntity>,
  definition: AggregateRequestDefinition<TEntity>,
) {
  const dimensionNames = Object.keys(definition.dimensions);

  function toGroups(requestedGroups: string[]) {
    const groupBy: (keyof TEntity & string)[] = [];
    const groupByExpressions: AggregateGroupExpression<string>[] = [];
    const groupNames = new Set<string>();
    for (const name of requestedGroups) {
      if (typeof name !== 'string' || !Object.hasOwn(definition.dimensions, name) || groupNames.has(name)) {
        invalidAggregate(`Invalid or duplicate aggregate group: ${String(name)}`);
      }
      groupNames.add(name);
      const dimension = definition.dimensions[name];
      if ('expression' in dimension) groupByExpressions.push({ field: name, expression: dimension.expression });
      else if (dimension.field === name) groupBy.push(dimension.field);
      else invalidAggregate(`Aggregate group ${name} must use its entity field name.`);
    }

    return { groupBy, groupByExpressions, groupNames };
  }

  function toAggregates(requestedMetrics: AggregateMetricRequestDto[], groupNames: Set<string>): AggregateSpec<TEntity> {
    const aggregates: AggregateSpec<TEntity> = Object.create(null) as AggregateSpec<TEntity>;
    const names = new Set<string>();
    for (const metric of requestedMetrics) {
      if (!metric || typeof metric.name !== 'string' || !/^[A-Za-z_]\w*$/.test(metric.name)
        || Object.hasOwn(Object.prototype, metric.name) || names.has(metric.name) || groupNames.has(metric.name)) {
        invalidAggregate(`Invalid or duplicate aggregate metric name: ${String(metric?.name)}`);
      }
      names.add(metric.name);
      if (!AGGREGATE_FUNCTIONS.includes(metric.function)) invalidAggregate(`Unknown aggregate function: ${String(metric.function)}`);
      if (metric.field === undefined) {
        if (metric.function !== 'count') invalidAggregate(`${metric.function} requires a field.`);
        aggregates[metric.name] = { fn: 'count' };
        continue;
      }
      if (typeof metric.field !== 'string' || !Object.hasOwn(definition.fields, metric.field)) {
        invalidAggregate(`Unsupported aggregate field: ${String(metric.field)}`);
      }
      const field = definition.fields[metric.field];
      if (!AGGREGATE_FUNCTION_RULES[metric.function].fieldTypes.includes(field.type)) {
        invalidAggregate(`${metric.function} is not supported for ${field.type} field ${metric.field}.`);
      }
      aggregates[metric.name] = { fn: metric.function, field: field.field, valueType: field.type };
    }
    return aggregates;
  }

  function toHaving(requested: AggregateHavingRequestDto[] | undefined, aggregates: AggregateSpec<TEntity>): AggregateHaving[] | undefined {
    if (requested === undefined) return undefined;
    return requested.map(({ field, op, value }) => {
      if (!Object.hasOwn(aggregates, field)) invalidAggregate(`Having field must name an aggregate metric: ${field}`);
      const aggregate = aggregates[field];
      if (aggregate.fn === 'count' || aggregate.valueType === 'number') {
        if (typeof value !== 'number' || !Number.isFinite(value)) invalidAggregate(`Having value for ${field} must be a number.`);
        return { field, op, value };
      }
      if (aggregate.valueType === 'date') {
        if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) invalidAggregate(`Having value for ${field} must be a valid date string.`);
        return { field, op, value: new Date(value) };
      }
      if (aggregate.valueType === 'string') {
        if (typeof value !== 'string') invalidAggregate(`Having value for ${field} must be a string.`);
        return { field, op, value };
      }
      return invalidAggregate(`Having is not supported for aggregate ${field}.`);
    });
  }

  function toOrderBy(requested: AggregateOrderByRequestDto[] | undefined, groupNames: Set<string>, aggregates: AggregateSpec<TEntity>): AggregateOrderBy[] | undefined {
    if (requested === undefined) return undefined;
    const names = new Set<string>();
    return requested.map(({ field, direction }) => {
      if ((!groupNames.has(field) && !Object.hasOwn(aggregates, field)) || names.has(field)) {
        invalidAggregate(`Order field must uniquely name a selected group or aggregate: ${field}`);
      }
      names.add(field);
      return { field, direction };
    });
  }

  const EntityAggregateDto = EntityDto(entity) as typeof BaseDto;

  class AggregateQuery extends EntityAggregateDto {
    @ApiPropertyOptional({ type: [AggregateMetricRequestDto], description: `Allowed fields: ${Object.keys(definition.fields).join(', ') || 'none'}` })
    @ValidateIf((_object, value) => value !== undefined)
    @TransformType(() => AggregateMetricRequestDto)
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    metrics: AggregateMetricRequestDto[] = definition.defaultMetrics.map((metric) => AggregateMetricRequestDto.parse(metric));

    @ApiPropertyOptional({ enum: dimensionNames, isArray: true })
    @ValidateIf((_object, value) => value !== undefined)
    @IsArray()
    @ArrayUnique()
    @IsIn(dimensionNames, { each: true })
    groupBy: string[] = [];

    @ApiPropertyOptional({ type: [AggregateHavingRequestDto] })
    @ValidateIf((_object, value) => value !== undefined)
    @TransformType(() => AggregateHavingRequestDto)
    @IsArray()
    @ValidateNested({ each: true })
    having?: AggregateHavingRequestDto[];

    @ApiPropertyOptional({ type: [AggregateOrderByRequestDto] })
    @ValidateIf((_object, value) => value !== undefined)
    @TransformType(() => AggregateOrderByRequestDto)
    @IsArray()
    @ValidateNested({ each: true })
    orderBy?: AggregateOrderByRequestDto[];

    @ApiPropertyOptional({ type: Number, minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number;

    toQuery(): AggregateRequestQuery<TEntity> {
      if (!Array.isArray(this.metrics) || !this.metrics.length) invalidAggregate('At least one aggregate metric is required.');
      if (!Array.isArray(this.groupBy)) invalidAggregate('groupBy must be an array.');

      if (this.take !== undefined && (!Number.isInteger(this.take) || this.take < 1)) invalidAggregate('take must be a positive integer.');
      const { groupBy, groupByExpressions, groupNames } = toGroups(this.groupBy);
      const aggregates = toAggregates(this.metrics, groupNames);
      const having = toHaving(this.having, aggregates);
      const orderBy = toOrderBy(this.orderBy, groupNames, aggregates);
      return { groupBy, groupByExpressions, aggregates, ...(having ? { having } : {}), ...(orderBy ? { orderBy } : {}), ...(this.take ? { take: this.take } : {}) };
    }
  }

  return AggregateQuery as Type<EntityDtoFields<[Type<TEntity>]> & InstanceType<typeof AggregateQuery>> & typeof BaseDto;
}
