import { defineEnum } from '#/common/dto/enum';

export const SortDirection = defineEnum('SortDirection', {
  ASC: 'asc',
  DESC: 'desc',
} as const);

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];
export type SortKey<TEntity extends object> = Extract<keyof TEntity, string>;

export abstract class SortableRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> {
  abstract sort: TSortKey[];
  abstract direction: SortDirection[];

  protected toOrderBy(): Record<string, SortDirection> {
    return this.sort.reduce<Record<string, SortDirection>>((orderBy, field, index) => {
      orderBy[field] = this.direction[index] ?? SortDirection.ASC;
      return orderBy;
    }, {});
  }
}
