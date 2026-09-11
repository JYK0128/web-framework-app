import { ApiProperty } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { Resource } from '#/entities/auth.extensions/resource.entity';

export class ResourceItemDto extends EntityDto(Resource) {
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
