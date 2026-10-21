import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@pkg/server-core/http/dto';
import { Type } from 'class-transformer';

import { ServiceAgreementHistoryItemDto } from '~/modules/service-term/agreement/service-agreement-history-item.dto';

export class GetServiceAgreementHistoryResponseDto extends CursorResponseDto<ServiceAgreementHistoryItemDto> {
  @ApiProperty({ type: () => [ServiceAgreementHistoryItemDto] })
  @Type(() => ServiceAgreementHistoryItemDto)
  override items!: ServiceAgreementHistoryItemDto[];
}
