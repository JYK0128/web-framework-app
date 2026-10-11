import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { TermAgreementItemDto } from '#/modules/terms/dto/term-agreement-item.dto';

export class TermAgreementListResponseDto extends ListResponseDto<TermAgreementItemDto> {
  @ApiProperty({ type: [TermAgreementItemDto] })
  @Type(() => TermAgreementItemDto)
  override items!: TermAgreementItemDto[];
}
