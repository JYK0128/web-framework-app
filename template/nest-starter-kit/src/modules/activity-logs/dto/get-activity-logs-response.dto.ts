import { ApiProperty } from '@nestjs/swagger';

import { ActivityLogItemDto } from './activity-log-item.dto';

export class GetActivityLogsResponseDto {
  @ApiProperty({ type: () => [ActivityLogItemDto], description: '활동 로그 목록' })
  items!: ActivityLogItemDto[];

  @ApiProperty({ description: '전체 검색 건수' })
  totalCount!: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  hasNextPage!: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  hasPrevPage!: boolean;

  @ApiProperty({ description: '첫 번째 항목 커서', nullable: true })
  startCursor!: string | null;

  @ApiProperty({ description: '마지막 항목 커서 (다음 페이지 요청용)', nullable: true })
  endCursor!: string | null;
}
