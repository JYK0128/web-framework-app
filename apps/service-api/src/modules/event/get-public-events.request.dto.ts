import { ApiPropertyOptional } from '@nestjs/swagger';
import { CursorRequestDto } from '@pkg/server-core/http/dto/request/cursor.request.dto';
import { IsEnum, IsOptional } from 'class-validator';

import { Event, EventPhase } from '#/core/database/entities/events';

export class GetPublicEventsRequestDto extends CursorRequestDto<Event> {
  @ApiPropertyOptional({ enum: EventPhase }) @IsOptional() @IsEnum(EventPhase) phase?: EventPhase;
  override get searchFields(): (keyof Event)[] { return ['title', 'content']; }
}
