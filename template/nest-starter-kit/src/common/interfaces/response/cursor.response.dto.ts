import { ApiProperty } from '@nestjs/swagger';

export abstract class CursorResponseDto<TEntity extends object> {
  abstract items: TEntity[];

  @ApiProperty({ type: String, nullable: true, description: '시작 커서' })
  startCursor!: string | null;

  @ApiProperty({ type: String, nullable: true, description: '종료 커서' })
  endCursor!: string | null;

  @ApiProperty({ type: Boolean, description: '다음 페이지 존재 여부' })
  hasNextPage!: boolean;

  @ApiProperty({ type: Boolean, description: '이전 페이지 존재 여부' })
  hasPrevPage!: boolean;

  @ApiProperty({ type: Number, description: '전체 개수' })
  totalCount!: number;
}
