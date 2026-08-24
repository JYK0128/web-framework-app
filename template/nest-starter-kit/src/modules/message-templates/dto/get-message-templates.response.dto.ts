import { ApiProperty } from '@nestjs/swagger';

import { MessageTemplateItemDto } from './message-template-item.dto';

export class GetMessageTemplatesResponseDto {
  @ApiProperty({ type: [MessageTemplateItemDto] })
  items!: MessageTemplateItemDto[];

  @ApiProperty({ type: 'number' })
  total!: number;
}
