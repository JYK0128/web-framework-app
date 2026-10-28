import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';

import type { BaseEntity } from '~/core/database/entities/base.entity';

const GetEventsRequestDtoBase = QueryRequestDtoFor<BaseEntity>()({
  search: { fields: [] },
  sort: { fields: ['startsAt', 'createdAt'], default: ['startsAt'] },
  page: {},
});

export class GetEventsRequestDto extends GetEventsRequestDtoBase {
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
