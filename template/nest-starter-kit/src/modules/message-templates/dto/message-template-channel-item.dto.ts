import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { MessageChannel } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';

export class MessageTemplateChannelItemDto extends EntityDto(MessageTemplateChannel) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiEnumOptional({ enum: MessageChannel })
  override channel!: MessageChannel;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  override title: string | null = null;

  @ApiProperty({ type: 'string' })
  override body!: string;

  @ApiProperty({ type: 'integer', default: 1 })
  override priority!: number;

  @ApiProperty({ type: 'boolean', default: true })
  override isActive!: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, nullable: true })
  override extraConfig: Record<string, unknown> | null = null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  override updatedAt!: Date;

  constructor(entity?: MessageTemplateChannel) {
    super();
    if (entity) {
      this.id = entity.id;
      this.channel = entity.channel;
      this.title = entity.title ?? null;
      this.body = entity.body;
      this.priority = entity.priority;
      this.isActive = entity.isActive;
      this.extraConfig = (entity.extraConfig as Record<string, unknown>) ?? null;
      this.createdAt = entity.createdAt;
      this.updatedAt = entity.updatedAt;
    }
  }
}
