import { ApiProperty } from '@nestjs/swagger';

import { CursorResponseDto } from '#/common/interfaces';

import { TermDto } from './term.dto';

export class GetTermHistoryCursorResponseDto extends CursorResponseDto<TermDto> {
  @ApiProperty({ type: () => [TermDto] })
  override items!: TermDto[];
}
