import type { Opt, Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/legacy';

import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

import { Notice } from './notice.entity';

@Entity({ tableName: 'notice_read' })
@Unique({ properties: ['user', 'notice'] })
export class NoticeRead extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: Rel<User>;

  @ManyToOne(() => Notice, { deleteRule: 'cascade' })
  notice!: Rel<Notice>;

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  readAt: Opt<Date> = new Date();
}
