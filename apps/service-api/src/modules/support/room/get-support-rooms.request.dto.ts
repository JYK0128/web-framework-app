import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';

export class GetSupportRoomsRequestDto extends PageRequestDto<SupportRoom, 'lastMessageAt' | 'createdAt' | 'updatedAt' | 'id'> {
  @ApiPropertyOptional({ isArray: true, enum: ['lastMessageAt', 'createdAt', 'updatedAt', 'id'] })
  @IsIn(['lastMessageAt', 'createdAt', 'updatedAt', 'id'], { each: true })
  override sort: ('lastMessageAt' | 'createdAt' | 'updatedAt' | 'id')[] = ['lastMessageAt', 'createdAt'];

  override direction = ['desc' as const, 'desc' as const];

  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}
