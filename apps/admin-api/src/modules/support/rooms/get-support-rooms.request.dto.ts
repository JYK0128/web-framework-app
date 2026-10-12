import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import type { BaseEntity } from '#/core/database/entities/common';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';
import { SupportRoomStatus } from '#/modules/support/support.constants';

export class GetSupportRoomsRequestDto extends PageRequestDto<BaseEntity, 'lastMessageAt' | 'createdAt' | 'updatedAt' | 'id'> {
  @ApiPropertyOptional({ isArray: true, enum: ['lastMessageAt', 'createdAt', 'updatedAt', 'id'] })
  @IsIn(['lastMessageAt', 'createdAt', 'updatedAt', 'id'], { each: true })
  override sort: ('lastMessageAt' | 'createdAt' | 'updatedAt' | 'id')[] = ['lastMessageAt', 'createdAt'];

  override direction = ['desc' as const, 'desc' as const];

  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}
