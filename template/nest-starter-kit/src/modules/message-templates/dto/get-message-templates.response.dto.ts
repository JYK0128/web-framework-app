import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class GetMessageTemplatesResponseDto extends PageResponseDto<MessageTemplateItemDto> {
  @ApiProperty({ type: () => [MessageTemplateItemDto] })
  @Type(() => MessageTemplateItemDto)
  override items!: MessageTemplateItemDto[];
}
