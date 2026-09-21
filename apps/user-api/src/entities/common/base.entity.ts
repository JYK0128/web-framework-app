import { type Opt, QueryOrder } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';
import { cloneDeep, set } from 'lodash-es';

@Entity({ abstract: true, orderBy: { createdAt: QueryOrder.DESC } })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'string', onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  createdAt: Opt<Date> = new Date();

  @Property({ type: 'string', length: 255, nullable: true })
  createdBy: Opt<string> | null = null;

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  updatedAt: Opt<Date> = new Date();

  @Property({ type: 'string', length: 255, nullable: true })
  updatedBy: Opt<string> | null = null;

  @Property({ type: 'timestamp', nullable: true })
  deletedAt: Opt<Date> | null = null;

  @Property({ type: 'string', length: 255, nullable: true })
  deletedBy: Opt<string> | null = null;

  @Property({ type: 'json', nullable: true })
  metadata: Opt<Record<string, unknown>> | null = null;

  updateMetadata<T extends Record<string, unknown> = Record<string, unknown>>(
    this: { metadata: Opt<T> | null },
    patchOrPath: Partial<T> | string,
    value?: unknown,
  ): void {
    const current = cloneDeep(this.metadata ?? {}) as Record<string, unknown>;

    if (typeof patchOrPath === 'string') {
      set(current, patchOrPath, value);
      this.metadata = current as unknown as Opt<T>;
      return;
    }

    this.metadata = {
      ...current,
      ...patchOrPath,
    } as unknown as Opt<T>;
  }
}
