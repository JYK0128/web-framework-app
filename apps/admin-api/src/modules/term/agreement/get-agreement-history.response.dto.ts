import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { AgreementHistoryItemDto } from '~/modules/term/agreement/agreement-history-item.dto';

export class GetAgreementHistoryResponseDto extends CursorResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  @Type(() => AgreementHistoryItemDto)
  override items!: AgreementHistoryItemDto[];
}
