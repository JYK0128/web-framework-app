import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { SupportRoom, SupportRoomStatus } from '~/core/database/entities/support';

const GetSupportRoomsRequestDtoBase = QueryRequestDtoFor<SupportRoom>()({
  search: { fields: [] },
  sort: { fields: ['lastMessageAt', 'createdAt', 'updatedAt', 'id'], default: ['lastMessageAt', 'createdAt'] },
  page: {},
});

export class GetSupportRoomsRequestDto extends GetSupportRoomsRequestDtoBase {
  @ApiPropertyOptional({ isArray: true, enum: ['lastMessageAt', 'createdAt', 'updatedAt', 'id'] })
  @IsIn(['lastMessageAt', 'createdAt', 'updatedAt', 'id'], { each: true })
  override sort: ('lastMessageAt' | 'createdAt' | 'updatedAt' | 'id')[] = ['lastMessageAt', 'createdAt'];

  override direction = ['desc' as const, 'desc' as const];

  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}
