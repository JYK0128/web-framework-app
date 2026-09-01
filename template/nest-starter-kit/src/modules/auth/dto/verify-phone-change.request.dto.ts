import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class VerifyPhoneChangeRequestDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsString()
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ type: 'string', example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
