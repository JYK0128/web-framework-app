import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/common/interfaces';

import { ServiceAgreementHistoryItemDto } from './service-agreement-history-item.dto';

export class ServiceAgreementHistoryCursorResponseDto extends CursorResponseDto<ServiceAgreementHistoryItemDto> {
  @ApiProperty({ type: () => [ServiceAgreementHistoryItemDto] })
  @Type(() => ServiceAgreementHistoryItemDto)
  override items!: ServiceAgreementHistoryItemDto[];
}
