import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces/response';

import { UserTermItemDto } from './user-term-item.dto';

export class GetUserTermsResponseDto extends PageResponseDto<UserTermItemDto> {
  @ApiProperty({ type: [UserTermItemDto] })
  @Type(() => UserTermItemDto)
  override items!: UserTermItemDto[];
}
