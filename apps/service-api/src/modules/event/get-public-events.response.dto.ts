import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@pkg/server-core/http/dto/response/cursor.response.dto';
import { Type } from 'class-transformer';

import { EventItemDto } from '#/modules/event/event-item.dto';

export class GetPublicEventsResponseDto extends CursorResponseDto<EventItemDto> {
  @ApiProperty({ type: [EventItemDto] })
  @Type(() => EventItemDto)
  items!: EventItemDto[];
}
