import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Resource } from '#/entities/auth.extentions/resource.entity';

export class ResourceDto extends DtoType(Resource) {
  constructor(resource: Resource) {
    super();
    this.id = resource.id;
    this.key = resource.key;
    this.label = resource.label;
    this.category = resource.category;
    this.description = resource.description ?? null;
    this.icon = resource.icon ?? null;
    this.actions = resource.actions;
    this.sortOrder = resource.sortOrder;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string', example: 'notice' })
  override key!: string;

  @ApiProperty({ type: 'string', example: '공지사항' })
  override label!: string;

  @ApiProperty({ type: 'string', example: 'contents' })
  override category!: string;

  @ApiProperty({ type: 'string', nullable: true, example: '서비스 공지사항 게시판' })
  override description!: string | null;

  @ApiProperty({ type: 'string', nullable: true, example: 'bell' })
  override icon!: string | null;

  @ApiProperty({ type: 'array', items: { type: 'string' }, example: ['create', 'read', 'update', 'delete'] })
  override actions!: string[];

  @ApiProperty({ type: 'number', example: 1 })
  override sortOrder!: number;
}
