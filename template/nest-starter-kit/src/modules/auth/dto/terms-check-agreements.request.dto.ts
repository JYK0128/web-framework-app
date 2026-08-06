import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TermsCheckAgreementsRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
