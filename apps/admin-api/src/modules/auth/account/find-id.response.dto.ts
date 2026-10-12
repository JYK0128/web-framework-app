import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { FindIdItemDto } from '#/modules/auth/account/find-id-item.dto';

export class FindIdResponseDto extends BaseDto {
  @ApiProperty({ type: [FindIdItemDto] }) @Type(() => FindIdItemDto) items!: FindIdItemDto[];
}
