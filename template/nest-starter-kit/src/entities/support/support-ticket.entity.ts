import { type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

export const SupportTicketStatus = defineEnum('SupportTicketStatus', {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const);

export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];

export const SupportTicketPriority = defineEnum('SupportTicketPriority', {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const);

export type SupportTicketPriority = (typeof SupportTicketPriority)[keyof typeof SupportTicketPriority];

@Entity({ tableName: 'support_ticket' })
export class SupportTicket extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;

  @ManyToOne(() => User, { nullable: true, deleteRule: 'set null' })
  assignee?: Rel<User> | null;

  @Property({ type: 'string', length: 50 })
  category!: string;

  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'string', length: 20, default: SupportTicketPriority.NORMAL })
  priority: Opt<SupportTicketPriority> = SupportTicketPriority.NORMAL;

  @Property({ type: 'string', length: 20, default: SupportTicketStatus.OPEN })
  status: Opt<SupportTicketStatus> = SupportTicketStatus.OPEN;

  @Property({ type: 'text', nullable: true })
  resolution: Opt<string> | null = null;
}
