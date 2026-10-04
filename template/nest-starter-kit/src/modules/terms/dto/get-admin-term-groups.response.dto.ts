import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { TermGroupItemDto } from './term-group-item.dto';

export class GetAdminTermGroupsResponseDto extends ListResponseDto<TermGroupItemDto> {
  @ApiProperty({ type: () => [TermGroupItemDto] })
  @Type(() => TermGroupItemDto)
  override items!: TermGroupItemDto[];
}
