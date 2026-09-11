import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import { EntityDto } from '#/common/dto/entity-dto';
import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';

import { MessageTemplateChannelDto } from './message-template-channel.dto';

export class MessageTemplateItemDto extends EntityDto(MessageTemplate) {
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

  @ApiProperty({ type: () => [MessageTemplateChannelDto] })
  @Type(() => MessageTemplateChannelDto)
  @Transform(({ value }: { value: unknown }) => {
    if (!value || typeof value !== 'object' || !('isInitialized' in value) || !('getItems' in value)) {
      return value ?? [];
    }

    const collection = value as {
      isInitialized: () => boolean
      getItems: () => MessageTemplateChannel[]
    };

    return collection.isInitialized() ? collection.getItems() : [];
  })
  channels: MessageTemplateChannelDto[] = [];

  @ApiProperty({ type: 'string', format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  override updatedAt!: Date;
}
