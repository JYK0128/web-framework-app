import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { Type } from 'class-transformer';

import { FindIdItemDto } from '#/modules/auth/account/find-id-item.dto';

export class FindIdResponseDto extends BaseDto {
  @ApiProperty({ type: [FindIdItemDto] }) @Type(() => FindIdItemDto) items!: FindIdItemDto[];
}
