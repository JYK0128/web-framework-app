import { ApiProperty } from '@nestjs/swagger';

export class PublicSystemConfigItemDto {
  @ApiProperty({ example: 'operation' })
  code!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  value!: unknown;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string | Date;
}

export class PublicSystemConfigListResponseDto {
  @ApiProperty({ type: [PublicSystemConfigItemDto] })
  configs!: PublicSystemConfigItemDto[];
}
