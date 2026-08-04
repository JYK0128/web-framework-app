import type { Opt } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

@Entity({ abstract: true })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: String })
  id: Opt<string> = uuid();

  @Property({ type: Date })
  createdAt: Opt<Date> = new Date();

  @Property({ type: String, length: 255, nullable: true })
  createdBy: Opt<string> | null = null;

  @Property({ type: Date })
  updatedAt: Opt<Date> = new Date();

  @Property({ type: String, length: 255, nullable: true })
  updatedBy: Opt<string> | null = null;

  @Property({ type: Date, nullable: true })
  deletedAt: Opt<Date> | null = null;

  @Property({ type: String, length: 255, nullable: true })
  deletedBy: Opt<string> | null = null;

  @Property({ type: 'json', nullable: true })
  metadata: Opt<Record<string, unknown>> | null = null;
}
