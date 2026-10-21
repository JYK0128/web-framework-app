import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { type LogEntry, type NormalizedLogError } from '@pkg/server-core/log-telemetry';
import { Type } from 'class-transformer';

export class LogErrorInfoDto extends BaseDto implements NormalizedLogError {
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) code!: string | null;
  @ApiProperty() message!: string;
  @ApiProperty({ type: Object, nullable: true, additionalProperties: true }) details!: unknown;
  @ApiProperty({ type: String, nullable: true }) stack!: string | null;
  @ApiProperty({ type: String, nullable: true }) sql!: string | null;
}

export class LogItemDto extends BaseDto implements LogEntry {
  @ApiProperty() id!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() level!: string;
  @ApiProperty() method!: string;
  @ApiProperty() url!: string;
  @ApiProperty() statusCode!: number;
  @ApiProperty() duration!: number;
  @ApiProperty() requestId!: string;
  @ApiProperty({ type: String, nullable: true }) ip!: string | null;
  @ApiProperty({ type: String, nullable: true }) userAgent!: string | null;
  @ApiProperty({ type: String, nullable: true }) emailHash!: string | null;
  @ApiProperty({ type: Object, nullable: true, additionalProperties: true }) requestBody!: Record<string, unknown> | null;
  @ApiProperty({ type: Object, nullable: true, additionalProperties: true }) responseBody!: Record<string, unknown> | null;
  @ApiProperty({ type: LogErrorInfoDto, nullable: true })
  @Type(() => LogErrorInfoDto)
  errorInfo!: LogErrorInfoDto | null;

  @ApiPropertyOptional({ type: String }) nanoTimestamp?: string;
}
