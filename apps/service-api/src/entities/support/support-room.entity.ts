import { type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

export const SupportRoomStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const;
export type SupportRoomStatus = (typeof SupportRoomStatus)[keyof typeof SupportRoomStatus];

@Entity({ tableName: 'support_room' })
export class SupportRoom extends BaseEntity {
  @ManyToOne(() => User, { fieldName: 'user_id', deleteRule: 'cascade' })
  user!: Rel<User>;

  @ManyToOne(() => User, { fieldName: 'assignee_id', nullable: true, deleteRule: 'set null' })
  assignee?: Rel<User> | null;

  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'string', length: 20, default: SupportRoomStatus.OPEN })
  status: Opt<SupportRoomStatus> = SupportRoomStatus.OPEN;

  @Property({ type: 'timestamp', nullable: true })
  lastMessageAt: Opt<Date> | null = null;
}
