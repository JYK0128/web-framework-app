import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyIdentityRequestDto {
  @ApiProperty({
    type: 'string',
    description: '포트원 본인인증 완료 후 발급된 identityVerificationId (또는 txId)',
    example: 'identity-verification-398d72b4-526e-4421-a46c-67cf8154649a',
  })
  @IsString()
  @IsNotEmpty()
  identityVerificationId!: string;
}
