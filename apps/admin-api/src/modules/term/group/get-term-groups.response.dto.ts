import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { TermGroupItemDto } from '~/modules/term/group/term-group-item.dto';

export class GetTermGroupsResponseDto extends ListResponseDto<TermGroupItemDto> {
  @ApiProperty({ type: [TermGroupItemDto] })
  @Type(() => TermGroupItemDto)
  override items!: TermGroupItemDto[];
}
