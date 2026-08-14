import { ApiProperty } from '@nestjs/swagger';

export class AgreementHistoryItemDto {
  @ApiProperty({ description: '동의 이력 ID' })
  id!: string;

  @ApiProperty({ description: '약관 ID' })
  termId!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  isRequired!: boolean;

  @ApiProperty()
  isAgreed!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;
}

export class GetAgreementHistoryResponseDto {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  items!: AgreementHistoryItemDto[];
}
