import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces/response';

import { UserTermGroupItemDto } from './user-term-group-item.dto';

export class GetUserTermGroupsResponseDto extends ListResponseDto<UserTermGroupItemDto> {
  @ApiProperty({ type: [UserTermGroupItemDto] })
  @Type(() => UserTermGroupItemDto)
  override items!: UserTermGroupItemDto[];
}
