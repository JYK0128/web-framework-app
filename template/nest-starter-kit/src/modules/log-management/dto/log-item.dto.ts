import { ApiProperty } from '@nestjs/swagger';

import { LogErrorInfoDto } from './log-error-info.dto';

export class LogItemDto {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  requestId!: string;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string' })
  method!: string;

  @ApiProperty({ type: 'string' })
  url!: string;

  @ApiProperty({ type: 'number' })
  statusCode!: number;

  @ApiProperty({ type: 'number' })
  duration!: number;

  @ApiProperty({ type: 'string', nullable: true })
  ip!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  userAgent!: string | null;

  @ApiProperty({ type: 'string' })
  level!: string;

  @ApiProperty({ type: 'string', nullable: true })
  emailHash!: string | null;

  @ApiProperty({ type: 'object', nullable: true, additionalProperties: true })
  requestBody!: Record<string, unknown> | null;

  @ApiProperty({ type: 'object', nullable: true, additionalProperties: true })
  responseBody!: Record<string, unknown> | null;

  @ApiProperty({ type: () => LogErrorInfoDto, nullable: true })
  errorInfo!: LogErrorInfoDto | null;
}
