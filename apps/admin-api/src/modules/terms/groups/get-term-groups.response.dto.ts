import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { TermGroupItemDto } from '#/modules/terms/groups/term-group-item.dto';

export class GetTermGroupsResponseDto extends ListResponseDto<TermGroupItemDto> {
  @ApiProperty({ type: [TermGroupItemDto] })
  @Type(() => TermGroupItemDto)
  override items!: TermGroupItemDto[];
}
