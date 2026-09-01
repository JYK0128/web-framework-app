import { ApiProperty } from '@nestjs/swagger';

export class SyncAnalyticsConsentResponseDto {
  @ApiProperty({ type: 'boolean', example: true })
  ok!: boolean;
}
