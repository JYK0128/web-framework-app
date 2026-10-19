import type { MessageEvent } from '@nestjs/common';

export interface SSEEvent<TData extends string | object = string | object> extends Omit<MessageEvent, 'data'> {
  data: TData
}
