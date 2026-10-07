import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { AdminTermItemDto } from './admin-term-item.dto';

export class GetAdminTermsResponseDto extends PageResponseDto<AdminTermItemDto> {
  @ApiProperty({ type: () => [AdminTermItemDto] })
  @Type(() => AdminTermItemDto)
  override items!: AdminTermItemDto[];
}
