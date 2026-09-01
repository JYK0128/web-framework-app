import { ApiProperty } from '@nestjs/swagger';

import { CursorResponseDto } from '#/common/interfaces';

import { AgreementHistoryItemDto } from './get-agreement-history.response.dto';

export class GetAgreementHistoryCursorResponseDto extends CursorResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  override items!: AgreementHistoryItemDto[];
}
