import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/core/http/dto/response/cursor.response.dto';
import { AgreementHistoryItemDto } from '#/modules/terms/agreements/agreement-history-item.dto';

export class GetAgreementHistoryResponseDto extends CursorResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  @Type(() => AgreementHistoryItemDto)
  override items!: AgreementHistoryItemDto[];
}
