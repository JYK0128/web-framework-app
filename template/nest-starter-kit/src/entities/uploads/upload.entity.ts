import type { Opt } from '@mikro-orm/core';
import { Entity, Enum, Index, Property } from '@mikro-orm/decorators/legacy';

import { defineEnum } from '#/common/dto/enum';
import { BaseEntity } from '#/entities/common/base.entity';

export const UploadStatus = defineEnum('UploadStatus', {
  PENDING: 'PENDING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const);

export type UploadStatus = (typeof UploadStatus)[keyof typeof UploadStatus];

@Entity({ tableName: 'upload' })
export class Upload extends BaseEntity {
  @Property({ type: 'string', length: 255 })
  originalName!: string;

  @Property({ type: 'string', length: 255 })
  @Index()
  storedName!: string;

  @Property({ type: 'string', length: 100 })
  mimeType!: string;

  @Property({ type: 'integer', default: 0 })
  size: Opt<number> = 0;

  @Property({ type: 'string', length: 100 })
  @Index()
  subDir!: string;

  @Property({ type: 'string', length: 500 })
  url!: string;

  @Enum(() => UploadStatus)
  @Index()
  status: Opt<UploadStatus> = UploadStatus.PENDING;

  @Property({ type: 'string', length: 255, nullable: true })
  @Index()
  uploaderId: Opt<string> | null = null;
}
