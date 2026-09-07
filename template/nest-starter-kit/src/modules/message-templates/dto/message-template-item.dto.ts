import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { MessageTemplate } from '#/entities/templates/message-template.entity';

import { MessageTemplateChannelItemDto } from './message-template-channel-item.dto';

export class MessageTemplateItemDto extends DtoType(MessageTemplate) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override code!: string;

  @ApiProperty({ type: 'string' })
  override name!: string;

  @ApiProperty({ type: 'array', items: { type: 'string' } })
  override variables: string[] = [];

  @ApiPropertyOptional({ type: 'string', nullable: true })
  override description: string | null = null;

  @ApiProperty({ type: 'boolean' })
  override isActive!: boolean;

  @ApiProperty({ type: () => [MessageTemplateChannelItemDto] })
  channels: MessageTemplateChannelItemDto[] = [];

  @ApiProperty({ type: 'string', format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  override updatedAt!: Date;

  constructor(entity?: MessageTemplate) {
    super();
    if (entity) {
      this.id = entity.id;
      this.code = entity.code;
      this.name = entity.name;
      this.variables = entity.variables ?? [];
      this.description = entity.description ?? null;
      this.isActive = entity.isActive;
      this.createdAt = entity.createdAt;
      this.updatedAt = entity.updatedAt;

      if (entity.channels && entity.channels.isInitialized()) {
        this.channels = entity.channels
          .getItems()
          .map((c) => new MessageTemplateChannelItemDto(c))
          .sort((a, b) => a.priority - b.priority);
      }
    }
  }
}
