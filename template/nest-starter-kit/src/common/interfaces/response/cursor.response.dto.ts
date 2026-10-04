import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export abstract class CursorResponseDto<TEntity extends object> extends BaseDto {
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
