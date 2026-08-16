import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

import { FilterableRequestDto } from './filterable.request.dto';

export const SortDirection = defineEnum('SortDirection', {
  ASC: 'asc',
  DESC: 'desc',
} as const);

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];
export type SortKey<TEntity extends BaseEntity> = Extract<keyof TEntity, string>;

export abstract class SortableRequestDto<
  TEntity extends BaseEntity,
  TSortKey extends string = SortKey<TEntity>,
> extends FilterableRequestDto<TEntity> {
  @ApiPropertyOptional({ example: ['createdAt'], isArray: true, description: '정렬 필드 목록' })
  @IsOptional()
  @IsString({ each: true })
  sort: TSortKey[] = ['createdAt' as TSortKey];

  @ApiPropertyOptional({ example: ['desc'], isArray: true, enum: SortDirection, description: '정렬 방향' })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = [SortDirection.DESC];

  protected toOrderBy(): Record<string, SortDirection> {
    return this.sort.reduce<Record<string, SortDirection>>((orderBy, field, index) => {
      orderBy[field] = this.direction[index] ?? SortDirection.ASC;
      return orderBy;
    }, {});
  }
}
