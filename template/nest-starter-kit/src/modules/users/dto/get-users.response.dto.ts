import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { UserItemDto } from './user-item.dto';

export class GetUsersResponseDto extends PageResponseDto<UserItemDto> {
  @ApiProperty({ type: () => [UserItemDto] })
  override items!: UserItemDto[];
}
