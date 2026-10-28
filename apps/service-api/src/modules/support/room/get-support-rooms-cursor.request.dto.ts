import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { SupportRoom, SupportRoomStatus } from '~/core/database/entities/support';

const GetSupportRoomsCursorRequestDtoBase = QueryRequestDtoFor<SupportRoom>()({
  search: { fields: [] },
  sort: { fields: ['createdAt', 'id'], default: ['createdAt', 'id'] },
  cursor: {},
});

export class GetSupportRoomsCursorRequestDto extends GetSupportRoomsCursorRequestDtoBase {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'id'] })
  @IsIn(['createdAt', 'id'], { each: true })
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];

  override direction = ['desc' as const, 'desc' as const];
}
