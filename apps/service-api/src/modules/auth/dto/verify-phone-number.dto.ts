import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { OkResponseDto } from '#/common/interfaces/response/ok.response.dto';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, description: 'PortOne verification transaction ID' })
  @IsString()
  @IsNotEmpty()
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto extends OkResponseDto {}
