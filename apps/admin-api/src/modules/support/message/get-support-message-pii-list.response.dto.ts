import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { SupportMessageItemDto } from '~/modules/support/message/support-message-item.dto';

export class GetSupportMessagePiiListResponseDto extends ListResponseDto<SupportMessageItemDto> {
  @ApiProperty({ type: [SupportMessageItemDto] })
  @Type(() => SupportMessageItemDto)
  override items!: SupportMessageItemDto[];
}
