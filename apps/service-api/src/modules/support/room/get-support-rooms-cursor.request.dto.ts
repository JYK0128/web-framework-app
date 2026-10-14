import { ApiPropertyOptional } from '@nestjs/swagger';
import { CursorRequestDto } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';

export class GetSupportRoomsCursorRequestDto extends CursorRequestDto<SupportRoom, 'createdAt' | 'id'> {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'id'] })
  @IsIn(['createdAt', 'id'], { each: true })
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];

  override direction = ['desc' as const, 'desc' as const];
}
