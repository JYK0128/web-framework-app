import { ApiProperty } from '@nestjs/swagger';

import { LogItemDto } from './log-item.dto';

export class GetLogsResponseDto {
  @ApiProperty({ type: () => [LogItemDto] })
  items!: LogItemDto[];

  @ApiProperty({ type: 'number' })
  totalCount!: number;

  @ApiProperty({ type: 'boolean' })
  hasNextPage!: boolean;

  @ApiProperty({ type: 'boolean' })
  hasPrevPage!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  startCursor!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  endCursor!: string | null;
}
