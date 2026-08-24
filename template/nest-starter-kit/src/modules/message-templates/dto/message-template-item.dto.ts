import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { MessageChannel, MessageTemplate } from '#/entities/templates/message-template.entity';

export class MessageTemplateItemDto extends DtoType(MessageTemplate) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override code!: string;

  @ApiProperty({ type: 'string', example: 'ko' })
  override locale!: string;

  @ApiEnumOptional({ enum: MessageChannel })
  override channel!: MessageChannel;

  @ApiProperty({ type: 'string' })
  override name!: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  override title: string | null = null;

  @ApiProperty({ type: 'string' })
  override body!: string;

  @ApiProperty({ type: 'array', items: { type: 'string' } })
  override variables: string[] = [];

  @ApiPropertyOptional({ type: 'string', nullable: true })
  override description: string | null = null;

  @ApiProperty({ type: 'boolean' })
  override isActive!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  override updatedAt!: Date;

  constructor(entity?: MessageTemplate) {
    super();
    if (entity) {
      this.id = entity.id;
      this.code = entity.code;
      this.locale = entity.locale;
      this.channel = entity.channel;
      this.name = entity.name;
      this.title = entity.title;
      this.body = entity.body;
      this.variables = entity.variables ?? [];
      this.description = entity.description;
      this.isActive = entity.isActive;
      this.createdAt = entity.createdAt;
      this.updatedAt = entity.updatedAt;
    }
  }
}
