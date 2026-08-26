import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class GetMessageTemplatesResponseDto extends PageResponseDto<MessageTemplateItemDto> {
  @ApiProperty({ type: () => [MessageTemplateItemDto] })
  override items!: MessageTemplateItemDto[];
}
