import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { EventItemDto } from '#/modules/events/event-item.dto';

export class EventPageResponseDto extends PageResponseDto<EventItemDto> { @ApiProperty({ type: [EventItemDto] }) @Type(() => EventItemDto) items!: EventItemDto[]; }
