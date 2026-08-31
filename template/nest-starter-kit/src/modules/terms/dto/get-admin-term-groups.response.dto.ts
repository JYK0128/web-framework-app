import { ApiProperty } from '@nestjs/swagger';

import { TermGroupItemDto } from './term-group-item.dto';

export class GetAdminTermGroupsResponseDto {
  @ApiProperty({ type: () => [TermGroupItemDto] })
  groups!: TermGroupItemDto[];
}
