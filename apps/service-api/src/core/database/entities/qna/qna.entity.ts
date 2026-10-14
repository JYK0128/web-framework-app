import { type Opt, type Rel } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/decorators/legacy';
import { QnaPriority, QnaStatus } from '@pkg/shared/constants';

import { User } from '#/core/database/entities/auth/user.entity';
import { BaseEntity } from '#/core/database/entities/base.entity';
import { ContentCategory } from '#/core/database/entities/common/content-category';

export const QnaCategory = ContentCategory;
export type QnaCategory = ContentCategory;

@Entity({ tableName: 'qna' })
export class Qna extends BaseEntity {
  @ManyToOne(() => User, { fieldName: 'user_id', deleteRule: 'cascade' }) user!: Rel<User>;
  @ManyToOne(() => User, { fieldName: 'assignee_id', nullable: true, deleteRule: 'set null' }) assignee?: Rel<User> | null;
  @Enum(() => ContentCategory) category!: ContentCategory;
  @Property({ type: 'string', length: 255 }) title!: string;
  @Property({ type: 'text' }) content!: string;
  @Property({ type: 'string', length: 20, default: QnaPriority.NORMAL }) priority: Opt<QnaPriority> = QnaPriority.NORMAL;
  @Property({ type: 'string', length: 20, default: QnaStatus.OPEN }) status: Opt<QnaStatus> = QnaStatus.OPEN;
  @Property({ type: 'text', nullable: true }) answer: Opt<string> | null = null;
}
