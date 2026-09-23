import { type Opt, type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

export const QnaStatus = { OPEN: 'open', IN_PROGRESS: 'in_progress', ANSWERED: 'answered', CLOSED: 'closed' } as const;
export type QnaStatus = (typeof QnaStatus)[keyof typeof QnaStatus];
export const QnaPriority = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' } as const;
export type QnaPriority = (typeof QnaPriority)[keyof typeof QnaPriority];

@Entity({ tableName: 'qna' })
export class Qna extends BaseEntity {
  @ManyToOne(() => User, { fieldName: 'user_id', deleteRule: 'cascade' }) user!: Rel<User>;
  @ManyToOne(() => User, { fieldName: 'assignee_id', nullable: true, deleteRule: 'set null' }) assignee?: Rel<User> | null;
  @Property({ type: 'string', length: 50 }) category!: string;
  @Property({ type: 'string', length: 255 }) title!: string;
  @Property({ type: 'text' }) content!: string;
  @Property({ type: 'string', length: 20, default: QnaPriority.NORMAL }) priority: Opt<QnaPriority> = QnaPriority.NORMAL;
  @Property({ type: 'string', length: 20, default: QnaStatus.OPEN }) status: Opt<QnaStatus> = QnaStatus.OPEN;
  @Property({ type: 'text', nullable: true }) answer: Opt<string> | null = null;
}
