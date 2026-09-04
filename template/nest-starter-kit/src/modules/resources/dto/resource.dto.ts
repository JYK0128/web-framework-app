import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Resource } from '#/entities/auth.extentions/resource.entity';

export class ResourceDto extends DtoType(Resource) {
  constructor(resource: Resource) {
    super();
    this.id = resource.id;
    this.key = resource.key;
    this.label = resource.label;
    this.description = resource.description ?? null;
    this.actions = resource.actions;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string', example: 'notice' })
  override key!: string;

  @ApiProperty({ type: 'string', example: '공지사항' })
  override label!: string;

  @ApiProperty({ type: 'string', nullable: true, example: '서비스 공지사항 게시판' })
  override description!: string | null;

  @ApiProperty({ type: 'array', items: { type: 'string' }, example: ['create', 'read', 'update', 'delete'] })
  override actions!: string[];
}
