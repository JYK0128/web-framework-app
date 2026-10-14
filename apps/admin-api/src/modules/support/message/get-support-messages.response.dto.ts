import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { SupportMessageItemDto } from '#/modules/support/message/support-message-item.dto';

export class GetSupportMessagesResponseDto extends ListResponseDto<SupportMessageItemDto> {
  @ApiProperty({ type: [SupportMessageItemDto] })
  @Type(() => SupportMessageItemDto)
  override items!: SupportMessageItemDto[];
}
