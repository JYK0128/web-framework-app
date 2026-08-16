import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityLogItemDto {
  @ApiProperty({ description: '로그 고유 식별자' })
  id!: string;

  @ApiProperty({ description: '요청 고유 식별자' })
  requestId!: string;

  @ApiProperty({ description: '발생 시각' })
  createdAt!: Date;

  @ApiProperty({ description: 'HTTP 메소드', example: 'GET' })
  method!: string;

  @ApiProperty({ description: '요청 경로', example: '/api/v1/users' })
  url!: string;

  @ApiProperty({ description: 'HTTP 응답 상태 코드', example: 200 })
  statusCode!: number;

  @ApiProperty({ description: '응답 소요 시간 (ms)', example: 15 })
  duration!: number;

  @ApiPropertyOptional({ description: '클라이언트 IP', example: '127.0.0.1', nullable: true })
  ip?: string | null;

  @ApiPropertyOptional({ description: 'User-Agent', nullable: true })
  userAgent?: string | null;

  @ApiProperty({ description: '로그 레벨', example: 'INFO' })
  level!: string;

  @ApiPropertyOptional({ description: '사용자 이메일 해시 (익명 식별자)', nullable: true })
  emailHash?: string | null;

  @ApiPropertyOptional({ description: '요청 바디 (JSON)', nullable: true })
  requestBody?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '응답 바디 (JSON)', nullable: true })
  responseBody?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '에러 메시지', nullable: true })
  errorMessage?: string | null;
}
