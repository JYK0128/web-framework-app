import { ApiProperty } from '@nestjs/swagger';

export class TermsCheckAgreementsResponseDto {
  @ApiProperty({ description: 'Whether the user has unagreed required terms' })
  hasUnagreed!: boolean;
}
