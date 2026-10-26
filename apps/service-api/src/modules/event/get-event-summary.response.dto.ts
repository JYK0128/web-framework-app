import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { AggregateResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { EventPhase } from '~/core/database/entities/events';

@ApiSchema({ name: 'EventSummaryItem' })
export class EventSummaryItemDto extends BaseDto {
  @ApiProperty({ enum: [...Object.values(EventPhase), 'all'] })
  phase!: EventPhase | 'all';

  @ApiProperty({ type: Number })
  eventCount!: number;
}

@ApiSchema({ name: 'GetEventSummaryResponse' })
export class GetEventSummaryResponseDto extends AggregateResponseDto<EventSummaryItemDto> {
  @ApiProperty({ type: [EventSummaryItemDto] })
  @Type(() => EventSummaryItemDto)
  override items!: EventSummaryItemDto[];
}
