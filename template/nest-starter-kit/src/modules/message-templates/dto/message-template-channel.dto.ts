import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { MessageChannel } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';

export class MessageTemplateChannelDto extends EntityDto(MessageTemplateChannel) {
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
}
