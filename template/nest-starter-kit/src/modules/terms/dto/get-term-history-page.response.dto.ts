import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { TermDto } from './term.dto';

export class GetTermHistoryPageResponseDto extends PageResponseDto<TermDto> {
  @ApiProperty({ type: () => [TermDto] })
  override items!: TermDto[];
}
