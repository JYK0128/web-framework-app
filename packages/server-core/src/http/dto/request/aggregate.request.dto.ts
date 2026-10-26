import type { FilterQuery } from '@mikro-orm/core';
import { type Type } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { Type as TransformType } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { ToArray } from '#http/decorators/to-array.decorator';
import { ToNumber } from '#http/decorators/to-number.decorator';
import { BaseDto } from '#http/dto/base/base.dto';
import { type EntityDtoFields } from '#http/dto/base/entity.dto';

import { ApiFiltersProperty, type FilterFieldDefinitions, type Filters } from './filterable.request.dto';
import { SearchableRequestDto } from './searchable.request.dto';
import { SortDirection } from './sortable.request.dto';

export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';

export type AggregateSpec<TEntity extends object> = Record<string, {
  fn: AggregateFunction
  field?: keyof TEntity & string
}>;

export type AggregateHaving = {
  field: string
  op: '$gt' | '$gte' | '$lt' | '$lte' | '$eq' | '$ne'
  value: number
};

export type AggregateOrderBy = { field: string, direction: 'asc' | 'desc' };

export interface AggregateOptions<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[] = readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity> = AggregateSpec<TEntity>,
> {
  where?: FilterQuery<TEntity>
  groupBy?: TGroupBy
  aggregates: TAggregates
  having?: AggregateHaving[]
  orderBy?: AggregateOrderBy[]
  take?: number
}

export type AggregateValue<TSpec> = TSpec extends { fn: 'count' } ? number : number | null;
export type AggregateResult<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity>,
> = Partial<Pick<TEntity, TGroupBy[number]>> & {
  [K in keyof TAggregates]: AggregateValue<TAggregates[K]>
};

class AggregateHavingDto {
  @ApiProperty()
  @IsString()
  field!: string;

  @ApiProperty({ enum: ['$gt', '$gte', '$lt', '$lte', '$eq', '$ne'] })
  @IsEnum({ GT: '$gt', GTE: '$gte', LT: '$lt', LTE: '$lte', EQ: '$eq', NE: '$ne' })
  op!: AggregateHaving['op'];

  @ApiProperty({ type: Number })
  @ToNumber()
  @IsNumber()
  value!: number;
}

export interface AggregateDefinition<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity>,
  TSearchKey extends keyof TEntity & string,
> {
  dimensions: TGroupBy
  aggregates: TAggregates
  searchFields?: readonly TSearchKey[]
  filterFields?: FilterFieldDefinitions<TEntity>
}

/** Builds an entity-aware request DTO with validated aggregate controls and MikroORM option mapping. */
export function AggregateRequestDto<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity>,
  TSearchKey extends keyof TEntity & string = keyof TEntity & string,
>(_entity: Type<TEntity>, definition: AggregateDefinition<TEntity, TGroupBy, TAggregates, TSearchKey>) {
  type AggregateSortKey = TGroupBy[number] | Extract<keyof TAggregates, string>;
  const declaredSortFields = [...definition.dimensions, ...Object.keys(definition.aggregates)] as AggregateSortKey[];

  abstract class EntityAggregateRequestDto extends SearchableRequestDto<TEntity, AggregateSortKey> {
    override filters: Filters<TEntity> = {};

    override get searchFields(): TSearchKey[] {
      return [...(definition.searchFields ?? [])];
    }

    protected override get filterFields(): FilterFieldDefinitions<TEntity> {
      return definition.filterFields ?? {};
    }

    @ApiPropertyOptional({ enum: declaredSortFields, isArray: true })
    @IsOptional()
    @IsIn(declaredSortFields, { each: true })
    override sort: AggregateSortKey[] = [];

    @ApiPropertyOptional({ enum: definition.dimensions, isArray: true })
    @IsOptional()
    @ToArray()
    @IsArray()
    @IsIn(definition.dimensions, { each: true })
    groupBy: TGroupBy[number][] = [...definition.dimensions];

    @ApiPropertyOptional({ type: AggregateHavingDto, isArray: true })
    @IsOptional()
    @IsArray()
    @TransformType(() => AggregateHavingDto)
    @ValidateNested({ each: true })
    having?: AggregateHavingDto[];

    @ApiPropertyOptional({ type: Number, minimum: 1 })
    @IsOptional()
    @ToNumber()
    @IsInt()
    @Min(1)
    take?: number;

    toAggregateOptions(where?: FilterQuery<TEntity>): AggregateOptions<TEntity, TGroupBy, TAggregates> {
      const metricNames = Object.keys(definition.aggregates);
      const allowedSortFields = new Set<string>([...this.groupBy, ...metricNames]);
      for (const field of this.sort) {
        if (!allowedSortFields.has(field)) {
          throw new ApplicationError({ code: 'VALIDATION_ERROR', status: 400, message: `Unknown aggregate sort field: ${field}` });
        }
      }
      for (const condition of this.having ?? []) {
        if (!metricNames.includes(condition.field)) {
          throw new ApplicationError({ code: 'VALIDATION_ERROR', status: 400, message: `Unknown aggregate alias in having: ${condition.field}` });
        }
      }
      const requestWhere = super.toFilterQuery();
      const whereConditions = [requestWhere, where].filter((query): query is FilterQuery<TEntity> => !!query && Object.keys(query).length > 0);
      const sort = this.sort.length > 0 ? this.sort : this.groupBy.slice(0, 1);
      const orderBy = sort.map((field, index) => ({
        field,
        direction: this.direction[index] ?? SortDirection.ASC,
      }));
      return {
        where: whereConditions.length > 1 ? { $and: whereConditions } as FilterQuery<TEntity> : whereConditions[0],
        groupBy: this.groupBy as unknown as TGroupBy,
        aggregates: definition.aggregates,
        having: this.having,
        orderBy,
        take: this.take,
      };
    }
  }

  if (Object.keys(definition.filterFields ?? {}).length > 0) {
    ApiFiltersProperty()(EntityAggregateRequestDto.prototype, 'filters');
  }

  // EntityDto is a compile-time field hint; the factory itself adds the runtime request behavior.
  return EntityAggregateRequestDto as Type<EntityDtoFields<[Type<TEntity>]> & InstanceType<typeof EntityAggregateRequestDto>> & typeof BaseDto;
}
