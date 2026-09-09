import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { MessageChannel } from './message-channel.enum';
import { MessageTemplate } from './message-template.entity';

@Entity({ tableName: 'message_template_channel' })
@Unique({ properties: ['template', 'channel'] })
export class MessageTemplateChannel extends BaseEntity {
  @ManyToOne(() => MessageTemplate, { deleteRule: 'cascade' })
  template!: Rel<MessageTemplate>;

  @Property({ type: 'string', length: 30 })
  channel!: MessageChannel;

  @Property({ type: 'string', nullable: true, length: 255 })
  title: Opt<string> | null = null;

  @Property({ type: 'text' })
  body!: string;

  @Property({ type: 'integer', default: 1 })
  priority: Opt<number> = 1;

  @Property({ type: 'boolean', default: true })
  isActive: Opt<boolean> = true;

  @Property({ type: 'json', nullable: true })
  extraConfig?: Record<string, unknown> | null;
}
