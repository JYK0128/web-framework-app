import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/common/interfaces';

import { AgreementHistoryItemDto } from './agreement-history-item.dto';

export class GetAgreementHistoryResponseDto extends CursorResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  @Type(() => AgreementHistoryItemDto)
  override items!: AgreementHistoryItemDto[];
}
