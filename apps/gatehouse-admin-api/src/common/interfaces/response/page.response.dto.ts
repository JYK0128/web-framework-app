import { ApiProperty } from '@nestjs/swagger';

export abstract class PageResponseDto<TEntity extends object> {
  abstract items: TEntity[];

  @ApiProperty({ type: Number, description: '페이지 번호' })
  page!: number;

  @ApiProperty({ type: Number, description: '전체 페이지 수' })
  totalPages!: number;

  @ApiProperty({ type: Boolean, description: '다음 페이지 존재 여부' })
  hasNextPage!: boolean;

  @ApiProperty({ type: Boolean, description: '이전 페이지 존재 여부' })
  hasPrevPage!: boolean;

  @ApiProperty({ type: Number, description: '전체 개수' })
  totalCount!: number;
}
