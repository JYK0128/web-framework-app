import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/common/base.entity';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';
import { EVENT_PUBLICATION_STATUS } from '#/modules/events/dto/events.constants';

export class GetEventsRequestDto extends PageRequestDto<BaseEntity, 'startsAt' | 'createdAt'> {
  @ApiPropertyOptional({ enum: EVENT_PUBLICATION_STATUS }) @IsOptional() @IsIn(EVENT_PUBLICATION_STATUS) status?: typeof EVENT_PUBLICATION_STATUS[number];
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
