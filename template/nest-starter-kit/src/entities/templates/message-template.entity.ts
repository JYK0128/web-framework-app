import { Cascade, Collection, type Opt } from '@mikro-orm/core';
import { Entity, OneToMany, Property, Unique } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { MessageTemplateChannel } from './message-template-channel.entity';

export { MessageChannel } from './message-channel.enum';

@Entity({ tableName: 'message_template' })
@Unique({ properties: ['code'] })
export class MessageTemplate extends BaseEntity {
  @Property({ type: 'string', length: 100 })
  code!: string;

  @Property({ type: 'string', length: 100 })
  name!: string;

  @Property({ type: 'json' })
  variables: Opt<string[]> = [];

  @Property({ type: 'text', nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'boolean', default: true })
  isActive: Opt<boolean> = true;

  @OneToMany(() => MessageTemplateChannel, (channel) => channel.template, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  channels = new Collection<MessageTemplateChannel>(this);
}
