import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

import { SupportRoom } from './support-room.entity';

export const SupportMessageSenderType = {
  USER: 'user',
  BOT: 'bot',
  AGENT: 'agent',
  SYSTEM: 'system',
} as const;
export type SupportMessageSenderType = (typeof SupportMessageSenderType)[keyof typeof SupportMessageSenderType];

@Entity({ tableName: 'support_message' })
export class SupportMessage extends BaseEntity {
  @ManyToOne(() => SupportRoom, { fieldName: 'room_id', deleteRule: 'cascade' })
  room!: Rel<SupportRoom>;

  @ManyToOne(() => User, { fieldName: 'sender_user_id', nullable: true, deleteRule: 'set null' })
  senderUser?: Rel<User> | null;

  @Property({ type: 'string', length: 20 })
  senderType!: SupportMessageSenderType;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'timestamp', nullable: true })
  readAt: Opt<Date> | null = null;
}
