import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/schema/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const LogLevel = defineEnum('LogLevel', {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const);
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

@Entity({ tableName: 'log_entry' })
export class LogEntry extends BaseEntity {
  @Index() @Enum({ items: () => LogLevel, length: 20 }) level: LogLevel = LogLevel.INFO;
  @Index() @Property({ type: 'string', length: 20 }) method!: string;
  @Index() @Property({ type: 'string', length: 500 }) path!: string;
  @Index() @Property({ type: 'int' }) statusCode!: number;
  @Property({ type: 'int' }) durationMs!: number;
  @Index() @Property({ type: 'string', length: 255, nullable: true }) requestId: string | null = null;
  @Property({ type: 'string', length: 255, nullable: true }) ipAddress: string | null = null;
  @Property({ type: 'string', length: 500, nullable: true }) userAgent: string | null = null;
  @Property({ type: 'string', length: 255, nullable: true }) errorMessage: string | null = null;
}
