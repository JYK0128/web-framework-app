import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { TermGroupItemDto } from './term-group-item.dto';

export class GetAdminTermGroupsResponseDto extends ListResponseDto<TermGroupItemDto> {
  @ApiProperty({ type: () => [TermGroupItemDto] })
  override items!: TermGroupItemDto[];
}
