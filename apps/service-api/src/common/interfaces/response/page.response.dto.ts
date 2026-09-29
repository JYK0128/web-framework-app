import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export abstract class PageResponseDto<TEntity extends object> extends BaseDto {
  abstract items: TEntity[];
  @ApiProperty({ type: 'number' })
  page!: number;

  @ApiProperty({ type: 'number' })
  totalPages!: number;

  @ApiProperty({ type: 'boolean' })
  hasNextPage!: boolean;

  @ApiProperty({ type: 'boolean' })
  hasPrevPage!: boolean;

  @ApiProperty({ type: 'number' })
  totalCount!: number;
}
