import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { TermDto } from './term.dto';

export class GetTermsResponseDto extends ListResponseDto<TermDto> {
  @ApiProperty({ type: [TermDto] })
  override items!: TermDto[];
}
