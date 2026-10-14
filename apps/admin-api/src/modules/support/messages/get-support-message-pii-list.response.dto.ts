import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { SupportMessageItemDto } from '#/modules/support/messages/support-message-item.dto';

export class GetSupportMessagePiiListResponseDto extends ListResponseDto<SupportMessageItemDto> {
  @ApiProperty({ type: [SupportMessageItemDto] })
  @Type(() => SupportMessageItemDto)
  override items!: SupportMessageItemDto[];
}
