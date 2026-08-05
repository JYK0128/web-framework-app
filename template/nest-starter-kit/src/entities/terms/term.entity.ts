import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#/entities/common/base.entity';

import { TermGroup } from './term-group.entity';

export enum TermStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ tableName: 'term' })
export class Term extends BaseEntity {
  @ManyToOne(() => TermGroup, { deleteRule: 'cascade' })
  termGroup!: TermGroup;

  @Property({ type: 'varchar', length: 50 })
  version!: string;

  @Property({ type: 'text' })
  content!: string;

  @Enum({ items: () => TermStatus, default: TermStatus.DRAFT })
  status!: TermStatus;

  @Property({ type: 'timestamp', nullable: true })
  publishedAt?: Date | null;
}
