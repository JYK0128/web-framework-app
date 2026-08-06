import { ApiProperty } from '@nestjs/swagger';

export class TermsCreateChallengeResponseDto {
  @ApiProperty({ description: 'Challenge token' })
  token!: string;
}
