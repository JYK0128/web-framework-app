import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { TermAgreementItemDto } from '~/modules/term/agreement/term-agreement-item.dto';

export class GetAgreementsResponseDto extends ListResponseDto<TermAgreementItemDto> {
  @ApiProperty({ type: [TermAgreementItemDto] })
  @Type(() => TermAgreementItemDto)
  override items!: TermAgreementItemDto[];
}
