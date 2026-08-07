import { type Opt, QueryOrder } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { uuid } from '@pkg/shared/common';

@Entity({ abstract: true, orderBy: { createdAt: QueryOrder.DESC } })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: String, onCreate: () => uuid() })
  id: Opt<string> = uuid();

  @Property({ type: Date, onCreate: () => new Date() })
  createdAt: Opt<Date> = new Date();

  @Property({ type: String, length: 255, nullable: true })
  createdBy: Opt<string> | null = null;

  @Property({ type: Date, onCreate: () => new Date() })
  updatedAt: Opt<Date> = new Date();

  @Property({ type: String, length: 255, nullable: true })
  updatedBy: Opt<string> | null = null;

  @Property({ type: Date, nullable: true })
  deletedAt: Opt<Date> | null = null;

  @Property({ type: String, length: 255, nullable: true })
  deletedBy: Opt<string> | null = null;

  @Property({ type: 'json', nullable: true })
  metadata: Opt<Record<string, unknown>> | null = null;

  /**
   * 엔티티의 metadata 필드를 안전하게 부분 업데이트(Partial Patch)합니다.
   * 서브클래스에서 override metadata 타입을 정의한 경우 해당 타입이 자동 추론됩니다.
   */
  updateMetadata<T extends Record<string, unknown> = Record<string, unknown>>(
    this: { metadata: Opt<T> | null },
    patch: Partial<T>,
  ): void {
    this.metadata = {
      ...(this.metadata || {}),
      ...patch,
    } as unknown as Opt<T>;
  }
}
