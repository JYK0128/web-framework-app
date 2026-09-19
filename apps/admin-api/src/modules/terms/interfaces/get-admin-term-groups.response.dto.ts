import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces/response';

import { AdminTermGroupItemDto } from './admin-term-group-item.dto';

export class GetAdminTermGroupsResponseDto extends ListResponseDto<AdminTermGroupItemDto> {
  @ApiProperty({ type: [AdminTermGroupItemDto] })
  @Type(() => AdminTermGroupItemDto)
  override items!: AdminTermGroupItemDto[];
}
