import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/common/interfaces';

import { AgreementHistoryItemDto } from './get-agreement-history.response.dto';

export class GetAgreementHistoryCursorResponseDto extends CursorResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  @Type(() => AgreementHistoryItemDto)
  override items!: AgreementHistoryItemDto[];
}
