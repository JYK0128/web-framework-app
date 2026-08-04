import { randomUUID } from 'node:crypto';

import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ abstract: true })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: String })
  id: string = randomUUID();

  @Property({ type: Date })
  createdAt: Date = new Date();

  @Property({ type: String, length: 255, nullable: true })
  createdBy: string | null = null;

  @Property({ type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: String, length: 255, nullable: true })
  updatedBy: string | null = null;

  @Property({ type: Date, nullable: true })
  deletedAt: Date | null = null;

  @Property({ type: String, length: 255, nullable: true })
  deletedBy: string | null = null;

  @Property({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null = null;
}
