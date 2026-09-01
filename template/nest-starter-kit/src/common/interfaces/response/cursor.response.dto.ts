import { ApiProperty } from '@nestjs/swagger';

export abstract class CursorResponseDto<TEntity extends object> {
  abstract items: TEntity[];
  @ApiProperty({ type: 'string', nullable: true })
  startCursor!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  endCursor!: string | null;

  @ApiProperty({ type: 'boolean' })
  hasNextPage!: boolean;

  @ApiProperty({ type: 'boolean' })
  hasPrevPage!: boolean;

  @ApiProperty({ type: 'number' })
  totalCount!: number;
}
