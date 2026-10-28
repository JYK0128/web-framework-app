import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsOptional } from 'class-validator';

import { Event, EventPhase } from '~/core/database/entities/events';

const GetPublicEventsRequestDtoBase = QueryRequestDtoFor<Event>()({
  search: { fields: ['title', 'content'] },
  sort: { fields: ['createdAt'], default: ['createdAt'] },
  cursor: {},
});

export class GetPublicEventsRequestDto extends GetPublicEventsRequestDtoBase {
  @ApiPropertyOptional({ enum: EventPhase }) @IsOptional() @IsEnum(EventPhase) phase?: EventPhase;
}
