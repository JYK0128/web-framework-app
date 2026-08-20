import { ApiProperty } from '@nestjs/swagger';

import { ActivityLogItemDto } from './activity-log-item.dto';

export class GetActivityLogsResponseDto {
  @ApiProperty({ type: () => [ActivityLogItemDto] })
  items!: ActivityLogItemDto[];

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
