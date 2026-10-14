import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { TermAgreementItemDto } from '#/modules/terms/agreements/term-agreement-item.dto';

export class GetAgreementsResponseDto extends ListResponseDto<TermAgreementItemDto> {
  @ApiProperty({ type: [TermAgreementItemDto] })
  @Type(() => TermAgreementItemDto)
  override items!: TermAgreementItemDto[];
}
