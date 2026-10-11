import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/core/http/dto/response/cursor.response.dto';

import { AgreementHistoryItemDto } from './agreement-history-item.dto';

export class AgreementHistoryCursorResponseDto extends CursorResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  @Type(() => AgreementHistoryItemDto)
  override items!: AgreementHistoryItemDto[];
}
