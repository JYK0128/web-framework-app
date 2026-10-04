import { Collection, type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

import { InquiryMessage } from './inquiry-message.entity';

export const InquiryStatus = defineEnum('InquiryStatus', {
  PENDING: 'pending',
  ANSWERED: 'answered',
  CLOSED: 'closed',
} as const);

export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];

@Entity({ tableName: 'inquiry' })
export class Inquiry extends BaseEntity {
  @OneToMany(() => InquiryMessage, (message) => message.inquiry)
  messages = new Collection<InquiryMessage>(this);

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

  @Property({ type: 'string', length: 20, default: InquiryStatus.PENDING })
  status: Opt<InquiryStatus> = InquiryStatus.PENDING;
}
