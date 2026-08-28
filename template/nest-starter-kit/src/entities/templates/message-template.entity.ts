import type { Opt } from '@mikro-orm/core';
import { Entity, Property, Unique } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const MessageChannel = defineEnum('MessageChannel', {
  EMAIL: 'EMAIL',
  SLACK: 'SLACK',
  IN_APP: 'IN_APP',
  SMS: 'SMS',
  ALIMTALK: 'ALIMTALK',
} as const);

export type MessageChannel = (typeof MessageChannel)[keyof typeof MessageChannel];

@Entity({ tableName: 'message_template' })
@Unique({ properties: ['code'] })
export class MessageTemplate extends BaseEntity {
  @Property({ type: 'string', length: 100 })
  code!: string;

  @Property({ type: 'string', length: 30 })
  channel!: MessageChannel;

  @Property({ type: 'string', length: 100 })
  name!: string;

  @Property({ type: 'string', nullable: true, length: 255 })
  title: Opt<string> | null = null;

  @Property({ type: 'text' })
  body!: string;

  @Property({ type: 'json' })
  variables: Opt<string[]> = [];

  @Property({ type: 'text', nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'boolean', default: true })
  isActive: Opt<boolean> = true;
}
