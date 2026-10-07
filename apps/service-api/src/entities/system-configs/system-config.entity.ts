import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';
import { ServiceSystemConfigCode } from '@pkg/shared/constants';

import { BaseEntity } from '#/entities/common/base.entity';

@Entity({ tableName: 'system_config' })
export class SystemConfig extends BaseEntity {
  @Index()
  @Enum({ items: () => ServiceSystemConfigCode, length: 100, unique: true })
  code!: ServiceSystemConfigCode;

  @Property({ type: 'json' })
  value: unknown = {};

  @Property({ type: 'string', length: 255, nullable: true })
  description: string | null = null;
}
