import { ApiProperty } from '@nestjs/swagger';

export class AgreementHistoryItemDto {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  termId!: string;

  @ApiProperty({ type: 'string' })
  version!: string;

  @ApiProperty({ type: 'string' })
  content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: 'string' })
  code!: string;

  @ApiProperty({ type: 'string' })
  title!: string;

  @ApiProperty({ type: 'boolean' })
  isRequired!: boolean;

  @ApiProperty({ type: 'boolean' })
  isAgreed!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;
}
export class GetAgreementHistoryResponseDto {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  items!: AgreementHistoryItemDto[];
}
