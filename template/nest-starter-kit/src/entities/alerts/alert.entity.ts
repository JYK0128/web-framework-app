import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

export const AlertType = defineEnum('AlertType', {
  INQUIRY_REPLY: 'inquiry_reply',
  INQUIRY_MESSAGE: 'inquiry_message',
  NOTICE: 'notice',
  SYSTEM: 'system',
} as const);

export type AlertType = (typeof AlertType)[keyof typeof AlertType];

@Entity({ tableName: 'alert' })
export class Alert extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  @Index()
  user!: Rel<User>;

  @Enum(() => AlertType)
  type!: AlertType;

  @Property({ type: 'string', length: 255 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ type: 'string', length: 500, nullable: true })
  linkUrl: Opt<string> | null = null;

  @Property({ type: 'boolean', default: false })
  @Index()
  isRead: Opt<boolean> = false;

  @Property({ type: 'timestamp', nullable: true })
  readAt: Opt<Date> | null = null;
}
