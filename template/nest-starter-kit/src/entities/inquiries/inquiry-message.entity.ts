import type { Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { User } from '#/entities/auth/user.entity';
import { BaseEntity } from '#/entities/common/base.entity';

import { Inquiry } from './inquiry.entity';

export const InquiryMessageAuthorRole = defineEnum('InquiryMessageAuthorRole', {
  USER: 'user',
  ADMIN: 'admin',
} as const);

export type InquiryMessageAuthorRole = (typeof InquiryMessageAuthorRole)[keyof typeof InquiryMessageAuthorRole];

@Entity({ tableName: 'inquiry_message' })
export class InquiryMessage extends BaseEntity {
  @ManyToOne(() => Inquiry, { deleteRule: 'cascade' })
  inquiry!: Rel<Inquiry>;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  author!: Rel<User>;

  @Property({ type: 'varchar', length: 20 })
  authorRole!: InquiryMessageAuthorRole;

  @Property({ type: 'text' })
  content!: string;
}
