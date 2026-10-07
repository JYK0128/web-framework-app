import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base';

export class LogItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() level!: string;
  @ApiProperty() method!: string;
  @ApiProperty() path!: string;
  @ApiProperty() statusCode!: number;
  @ApiProperty() durationMs!: number;
  @ApiProperty({ nullable: true }) requestId!: string | null;
  @ApiProperty({ nullable: true }) ipAddress!: string | null;
  @ApiProperty({ nullable: true }) userAgent!: string | null;
  @ApiProperty({ nullable: true }) errorMessage!: string | null;
}
