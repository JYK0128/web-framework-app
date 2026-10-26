import { type BaseDto } from '#http/dto/base/base.dto';

import { ListResponseDto } from './list.response.dto';

/** Non-paginated aggregate rows with a shared DTO conversion entry point. */
export abstract class AggregateResponseDto<TItem extends object> extends ListResponseDto<TItem> {
  static fromRows<TResponse, TItem extends BaseDto>(
    this: { parse(value: unknown): TResponse },
    rows: unknown[],
    itemDto: { parseArray(values: unknown[]): TItem[] },
  ): TResponse {
    return this.parse({ items: itemDto.parseArray(rows) });
  }
}
