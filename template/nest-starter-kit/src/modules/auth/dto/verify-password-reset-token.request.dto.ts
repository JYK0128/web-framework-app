import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'VerifyPasswordResetTokenRequest' })
export class VerifyPasswordResetTokenRequestDto {
  @ApiProperty({ type: 'string', description: '챌린지 ID' })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: 'string', description: '검증 토큰' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
