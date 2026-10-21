import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { EventItemDto } from '~/modules/event/event-item.dto';

export class GetEventsResponseDto extends PageResponseDto<EventItemDto> {
  @ApiProperty({ type: [EventItemDto] })
  @Type(() => EventItemDto)
  items!: EventItemDto[];
}
