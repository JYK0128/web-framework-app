import type { Type } from '@nestjs/common';

import { BaseDto } from '../base/base.dto';
import { type CursorPart, withCursor } from './query-capabilities/cursor.query';
import { type FilterFieldDefinitions, type FilterPart, withFilter } from './query-capabilities/filter.query';
import { type PagePart, withPage } from './query-capabilities/page.query';
import type { QueryBaseClass, QueryOptions } from './query-capabilities/query.shared';
import { type SearchPart, withSearch } from './query-capabilities/search.query';
import { type SortDefinition, type SortPart, withSort } from './query-capabilities/sort.query';

type QueryDefinition<TEntity extends object> = {
  filter?: FilterFieldDefinitions<TEntity>
  search?: { fields: readonly (keyof TEntity)[] }
  sort?: SortDefinition
  page?: { defaultLimit?: number }
  cursor?: { defaultLimit?: number }
};
type Selected<T, K extends PropertyKey, TPart> = K extends keyof T ? TPart : object;
type QueryResult<TEntity extends object, TDefinition> = QueryOptions<TEntity>
  & Selected<TDefinition, 'sort', { orderBy: NonNullable<QueryOptions<TEntity>['orderBy']> }>
  & Selected<TDefinition, 'page', { page: number, limit: number }>
  & Selected<TDefinition, 'cursor', { first: number, orderBy: NonNullable<QueryOptions<TEntity>['orderBy']> }>;
type QueryDto<TEntity extends object, TDefinition> = BaseDto & { toQuery(): QueryResult<TEntity, TDefinition> }
  & Selected<TDefinition, 'filter', FilterPart<TEntity>>
  & Selected<TDefinition, 'search', SearchPart>
  & Selected<TDefinition, 'sort', SortPart>
  & Selected<TDefinition, 'page', PagePart>
  & Selected<TDefinition, 'cursor', CursorPart>;

/** Composes only the selected query capabilities. */
export function QueryRequestDto<TEntity extends object, const TDefinition extends QueryDefinition<TEntity>>(
  _entity: Type<TEntity>, definition: TDefinition,
): Type<QueryDto<TEntity, TDefinition>> & typeof BaseDto {
  if (definition.page && definition.cursor) throw new Error('Page and cursor cannot be used together');
  if (definition.cursor && !definition.sort) throw new Error('Cursor pagination requires sorting');
  if (definition.cursor && !definition.sort?.default?.length) throw new Error('Cursor pagination requires a default sort');
  if (definition.sort?.default?.some((field) => !definition.sort!.fields.includes(field))) {
    throw new Error('Default sort fields must be allowed');
  }

  class QueryRoot extends BaseDto {
    toQuery(): QueryOptions<TEntity> { return { where: {} }; }
  }
  let Dto: QueryBaseClass<TEntity> = QueryRoot;
  if (definition.filter) Dto = withFilter(Dto, definition.filter);
  if (definition.search) Dto = withSearch(Dto, definition.search.fields);
  if (definition.sort) Dto = withSort(Dto, definition.sort);
  if (definition.page) Dto = withPage(Dto, definition.page);
  if (definition.cursor) Dto = withCursor(Dto, definition.cursor);
  return Dto as Type<QueryDto<TEntity, TDefinition>> & typeof BaseDto;
}

/** Type-only entity binding for interfaces and abstract entity types. */
export function QueryRequestDtoFor<TEntity extends object>() {
  return <const TDefinition extends QueryDefinition<TEntity>>(definition: TDefinition) =>
    QueryRequestDto(Object as unknown as Type<TEntity>, definition);
}
