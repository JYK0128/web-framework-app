import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { TermAgreementItemDto } from './term-agreement-item.dto';

export class GetAgreementsResponseDto extends ListResponseDto<TermAgreementItemDto> {
  @ApiProperty({ type: [TermAgreementItemDto] })
  @Type(() => TermAgreementItemDto)
  override items!: TermAgreementItemDto[];
}
