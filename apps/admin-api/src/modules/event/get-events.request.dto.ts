import { PageRequestDto } from '@pkg/server-core/http/dto/request';

import type { BaseEntity } from '~/core/database/entities/base.entity';

export class GetEventsRequestDto extends PageRequestDto<BaseEntity, 'startsAt' | 'createdAt'> {
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
